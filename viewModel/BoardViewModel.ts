import {CrosswordBoard, GameStates} from "../models/CrosswordBoard";
import {WordViewModel} from "./WordViewModel";
import {CellViewModel} from "./CellViewModel";
import {Word} from "../models/Word";
import {LetterCell} from "../models/LetterCell";
import {Cameras} from "../scenes/Cameras";
import {DesktopGUI, GUI, MobileGUI} from "./GUI";
import Scene = Phaser.Scene;
import Camera = Phaser.Cameras.Scene2D.Camera;
import Rectangle = Phaser.Geom.Rectangle;
import Vector2 = Phaser.Math.Vector2;
import EventEmitter = Phaser.Events.EventEmitter;
import Size = Phaser.Structs.Size;


export class BoardViewModel extends EventEmitter{
    get cellWidth(): number {
        return this._cellWidth;
    }
    public static  EVENT_GOTO_START_SCENE:string = 'EVENT_GOTO_START_SCENE';
    private _board: CrosswordBoard;
    private _scene: Scene;
    private _wordViewModels: Array<WordViewModel> = new Array<WordViewModel>();
    private _cellViewModels: Array<CellViewModel> = new Array<CellViewModel>();
    private _boardCamera: Camera;
    private _lastPointPosition: Vector2|null;
    private _boardDragStartDistance: number = 5;
    private _dragBoardStarted: boolean = false;



    private _minBoardZoom: number = 0.5;
    private _maxBoardZoom: number = 2.3;
    private _gui:GUI;

    constructor(scene: Scene, board: CrosswordBoard) {
        super();
        this._scene = scene;
        this._boardCamera = this._scene.cameras.getCamera(Cameras.boardCameraName.toString());
        this._board = board;
        this._board.on(CrosswordBoard.EVENT_SELECT_WORD_ON_BOARD, this.onWordSelectedOnBoard.bind(this));
        this._board.once(CrosswordBoard.EVENT_ALL_WORDS_VALID, this.onAllWordsValid.bind(this));
        this._board.on(CrosswordBoard.EVENT_ON_STATE_CHANGED, this.onGameStateChanged.bind(this));

        this.buildGui();
        this.correctCellSizeAccordinglyGameSize();
        this.createWordsViews();
        this.resizeInternal(this._scene.game.canvas.width, this._scene.game.canvas.height, true);
    }

    private buildGui() {
        if (this._scene.sys.game.device.os.desktop && !this._scene.sys.game.device.input.touch) {
            this._gui = new DesktopGUI(this._scene, this._boardCamera, this._board);
        } else {
            this._gui = new MobileGUI(this._scene, this._boardCamera, this._board);
        }

        this._gui.questionsList.on('select', this.onQuestionSelected.bind(this));
    }

    private createWordsViews() {
        this._board.words.forEach(word => {
            let wvm = new WordViewModel(this._scene, word);

            word.cells.forEach(value => {
                let cvm = this.getCellViewModel(value);
                wvm.cellsViewModels.push(cvm);
            });
            this._wordViewModels.push(wvm);
        });
    }

    public resize(width: number, height: number) {
        this.resizeInternal(width, height, false);
    }

    public resizeInternal(width: number, height: number, immeadiatelyPan:boolean) {
        this._gui.resize(width, height);
        this.calculateCellsZone();
        this.calculateZoom();
        this.scrollToCellCenter(immeadiatelyPan);
    }

    public update(time: number, delta: number) {
        if (this._board.gameState == GameStates.gameplay) {
            let camera = this._scene.cameras.getCamera(Cameras.boardCameraName.toString());
            if (camera) {
                let game = this._scene.game;
                let pointerPosition = game.input.activePointer.position;
                if (game.input.activePointer.isDown) {
                    let pointerDownPosition = new Vector2(game.input.activePointer.downX, game.input.activePointer.downY);
                    if (this._lastPointPosition != null &&
                        (this._dragBoardStarted || this._lastPointPosition.distance(pointerPosition) >= this._boardDragStartDistance
                            && this._gui.boardZone.contains(pointerDownPosition.x, pointerDownPosition.y))) {
                        this._dragBoardStarted = true;
                        const positionChangeSpeedCoeff = 1 / camera.zoom;
                        camera.scrollX += (this._lastPointPosition.x - pointerPosition.x) * positionChangeSpeedCoeff;
                        camera.scrollY += (this._lastPointPosition.y - pointerPosition.y) * positionChangeSpeedCoeff;

                        let corrected:boolean = this.correctCameraScrollValues(false);
                        //todo prevent any drag if position was corrected by borders
                        // if(corrected)
                        // {
                        //     this._dragBoardStarted = false;
                        //     this._lastPointPosition = null;
                        //     return;
                        // }
                        // console.log(`scrollX: ${camera.scrollX} scrollY: ${camera.scrollY} cells l: ${this._cellsZone.left} t: ${this._cellsZone.top} midPoint: ${camera.midPoint.x} ${camera.midPoint.y} `);
                        // console.log(`   ${camera.midPoint.x - camera.displayWidth*0.5}   ${camera.midPoint.x - this._cellsZone.right}`)
                    } // set new drag origin to current position
                    this._lastPointPosition = pointerPosition.clone();
                } else {
                    this._lastPointPosition = null;
                    this._dragBoardStarted = false;
                }
            }
        }
    }

    public correctCameraScrollValues(immediate:boolean):boolean {
        let camera = this._boardCamera;

        let criticalTopLeftPoint: Vector2 = new Vector2(
            camera.displayWidth * 0.5 + this._cellsZone.left + this._cellsZone.width * 0.5,
            camera.displayHeight * 0.5 + this._cellsZone.top + this._cellsZone.height * 0.5);
        let criticalBottomRightPoint: Vector2 = new Vector2(
            -camera.displayWidth * 0.5 + this._cellsZone.left + this._cellsZone.width * 0.5,
            -camera.displayHeight * 0.5 + this._cellsZone.top + this._cellsZone.height * 0.5);
        let sctl: Vector2 = camera.getScroll(criticalTopLeftPoint.x, criticalTopLeftPoint.y);
        let scbr: Vector2 = camera.getScroll(criticalBottomRightPoint.x, criticalBottomRightPoint.y);

        let targetX: number = camera.scrollX + camera.width * 0.5;
        let targetY: number = camera.scrollY + camera.height * 0.5;
        let mustPan: boolean = false;
        if (camera.scrollX > sctl.x) {
            targetX = criticalTopLeftPoint.x;
            mustPan = true;
        } else if (camera.scrollX < scbr.x) {
            targetX = criticalBottomRightPoint.x;
            mustPan = true;
        }
        if (camera.scrollY > sctl.y) {
            targetY = criticalTopLeftPoint.y;
            mustPan = true;
        } else if (camera.scrollY < scbr.y) {
            targetY = criticalBottomRightPoint.y;
            mustPan = true;
        }
        if (mustPan) {
            //console.log(`correctCameraScrollValues targetX: ${targetX} targetY: ${targetY} ${camera.displayWidth}`);
            camera.pan(targetX, targetY, immediate?0:250, Phaser.Math.Easing.Bounce.Out, true);
        }
        return mustPan;

    }

    private calculateCellsZone() {
        let minimumCellXCoor = 99999;
        let maximumCellXCoor = -9999;
        let minimumCellYCoor = 99999;
        let maximumCellYCoor = -9999;
        this._cellViewModels.forEach(cell => {
            let halfCellWidth = cell.getWidth() * 0.5;
            let cellWidth = cell.getWidth();
            let leftX = cell.getXcoor() - halfCellWidth;
            if (leftX < minimumCellXCoor) {
                minimumCellXCoor = leftX;
            }
            if (leftX + cellWidth > maximumCellXCoor) {
                maximumCellXCoor = leftX + cellWidth;
            }

            let topY = cell.getYcoor() - halfCellWidth;
            if (topY < minimumCellYCoor) {
                minimumCellYCoor = topY;
            }
            if (topY + cellWidth > maximumCellYCoor) {
                maximumCellYCoor = topY + cellWidth;
            }
        });

        let cellsTotalWidth = maximumCellXCoor - minimumCellXCoor;
        let cellsTotalHeight = maximumCellYCoor - minimumCellYCoor;

        this._cellsZone = new Rectangle(minimumCellXCoor, minimumCellYCoor, cellsTotalWidth, cellsTotalHeight);
    }

    private calculateZoom(): void {
        let zoomX = this._gui.boardZone.width / this._cellsZone.width;
        let zoomY = this._gui.boardZone.height / this._cellsZone.height;
        let zoomTweakValue = 0.8; //allow to add visual space around the board

        let zoom = Math.min(zoomX, zoomY) * zoomTweakValue;

        this._minBoardZoom = zoom>0.1? zoom-0.1: 0.1;
        this._maxBoardZoom = zoom+0.5;

        this.setZoomInternal(zoom, false);
    }

    public setZoom(zoom: number, animate: boolean): void {
        this.setZoomInternal(zoom, animate);
    }

    private setZoomInternal(zoom: number, animate: boolean): void {
        zoom = Math.max(Math.min(zoom, this._maxBoardZoom), this._minBoardZoom);
        console.log(`set zoom: ${zoom}`);
        if (animate) {
            this._boardCamera.zoomTo(zoom, 250, Phaser.Math.Easing.Linear, true,  (camera, progress) => {
                if(progress==1)
                {
                    this.correctCameraScrollValues(animate);
                }
            });
             return;
        }

        this._boardCamera.zoom = zoom;
        this.correctCameraScrollValues(animate);
    }

    public scrollToCellCenter(immediately:boolean): void {
        // console.log(`scrollToCellCenter
        //     cellzone: left: ${this._cellsZone.left}
        //     width: ${this._cellsZone.width}
        //     centerX: ${this._cellsZone.left + this._cellsZone.width * 0.5}
        //     camera_midPoint: ${this._boardCamera.midPoint.x}, ${this._boardCamera.midPoint.y}
        //     camera_displayWidth: ${this._boardCamera.displayWidth}
        //     camera_width: ${this._boardCamera.width}
        //     camera_scroll: ${this._boardCamera.scrollX} ${this._boardCamera.scrollY}
        //     camera_zoom: ${this._boardCamera.zoom}`);

        this._boardCamera.pan(
            this._cellsZone.left + this._cellsZone.width * 0.5,
            this._cellsZone.top + this._cellsZone.height * 0.5,
            immediately?0:250,
            Phaser.Math.Easing.Linear,
            true);
    }

    private _cellsZone: Rectangle = new Rectangle();
    private _cellWidth: number;
    private _cellHeight: number;
    private _cellMarginAround = 5;

    private getCellViewModel(value: LetterCell) {
        let cvm = this._cellViewModels.find(v => v.cell.column == value.column && v.cell.row == value.row);
        if (cvm == null) {
            cvm = new CellViewModel(this._scene, value, this._cellWidth, this._cellHeight, this._cellMarginAround);
            cvm.on("selected", this.onCellPointerDown, this);
            this._cellViewModels.push(cvm);
        }
        return cvm;
    }

    private onCellPointerDown(cvm: CellViewModel) {
        this._board.selectCellByClick(cvm.cell);
    }

    private onQuestionSelected(data: any) {
        let word = data as Word;
        if (word) {
            this._board.selectWord(word);
        }
    }

    private onWordSelectedOnBoard(word: Word) {
        this._gui.questionsList.select(word);
    }

    private onGameStateChanged(board: CrosswordBoard): void {
        if(board.gameState==GameStates.gameend)
        {
            this._gui.keyboard.enabled = false;
        }
    }

    private onAllWordsValid(board: CrosswordBoard): void {
        this.scrollToCellCenter(false);
        let text = this._scene.add.text(0, 0, "You Win! Congratulations!").
        setX(Math.round(this._scene.sys.game.canvas.width * 0.5)).
        setY(Math.round(this._scene.sys.game.canvas.height * 0.5)).
        setOrigin(0.5, 0.5)
            .setInteractive()
            .once(Phaser.Input.Events.POINTER_DOWN, () => {
                    // text.destroy(true);
                this.emit(BoardViewModel.EVENT_GOTO_START_SCENE)
                }
            );
        this._boardCamera.ignore(text);
    }

    private correctCellSizeAccordinglyGameSize() {
        let size:Size = new Size(this._scene.game.canvas.width, this._scene.game.canvas.height);
        let cellsInColumn = Math.max( this._board.maximumCellColumn - this._board.minimumCellColumn-1, 7);
        let cellsInRow = Math.max( this._board.maximumCellRow - this._board.minimumCellRow-1, 7);

        //calculate cell's size considering devicePixelRatio
        let cellSize = Math.floor(Math.min(size.width/cellsInColumn, size.height/cellsInRow)) * window.devicePixelRatio;
        this._cellMarginAround = Math.round(cellSize/8);
        this._cellWidth = this._cellHeight = Math.round(cellSize);

     }


}




