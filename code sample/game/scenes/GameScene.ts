import {CrosswordBoard, GameStates} from "../models/CrosswordBoard";
import {BoardViewModel} from "../ViewModel/BoardViewModel";
import {GameObjPool} from "../ViewModel/GameObjPool";
import {Cameras} from "./Cameras";
import Group = Phaser.GameObjects.Group;
import {ICrosswordData} from "../../data/ICrosswordData";
import Pointer = Phaser.Input.Pointer;

export class GameScene extends Phaser.Scene {

    private _board: CrosswordBoard ;
    private _boardViewModel: BoardViewModel ;

    private _fpsOutput: Phaser.GameObjects.Text;
    
    constructor() {
        super('Game');
        GameObjPool.Pool = new Group(this);
    }

    public  create():void {
        this.initializeBoardCamera();
        this._board = new CrosswordBoard(this.game.registry.get('theme'));
        this._board.on(CrosswordBoard.EVENT_ON_STATE_CHANGED, this.onGameStateChanged.bind(this));

        const data:ICrosswordData = this.sys.getData();
        this._board.initialize(data);

        this._boardViewModel = new BoardViewModel(this, this._board);
        this._boardViewModel.once(BoardViewModel.EVENT_GOTO_START_SCENE, this.onGotoStartSceneRequsted.bind(this), this)
        this.input.on(Phaser.Input.Events.POINTER_WHEEL, this.onPointerWheel.bind(this));
        this.game.scale.on('resize', this.onResize, this);
        this._fpsOutput = this.add.text(20, 20, "");
        this.cameras.getCamera(Cameras.boardCameraName.toString()).ignore(this._fpsOutput);
    }

    private onResize (gameSize):void {
        let width = gameSize.width;
        let height = gameSize.height;
        console.log(`width: ${width} height: ${height}`);
        this._boardViewModel.resize(width, height);
    }

    public update(time: number, delta: number) {
        super.update(time, delta);
        this._boardViewModel.update(time, delta);
        this._fpsOutput.setText(`FPS: ${Math.floor(1000/delta).toString()} 
            devicePixelRatio: ${window.devicePixelRatio} 
            window size: ${window.innerWidth} ${window.innerHeight} 
            canvas size: ${this.game.canvas.width} ${this.game.canvas.height} 
            scale.displayScale: ${this.scale.displayScale.x} ${this.scale.displayScale.y} 
            scale.width&height: ${this.scale.width} ${this.scale.height}  
            
            cellWidth: ${this._boardViewModel.cellWidth}`);
    }

    private initializeBoardCamera() {
        let camera = this.cameras.getCamera(Cameras.boardCameraName.toString());
        if(camera!=null)
        {
            return;
        }

        let c = this.cameras.add(0,0,this.cameras.main.width, this.cameras.main.height, false, Cameras.boardCameraName.toString())
            .setOrigin(0.5)
            .setRoundPixels(true);
       
    }

    private onPointerWheel(p:Pointer): void {
        var cam = this.cameras.getCamera(Cameras.boardCameraName.toString());
        const scaleChangeSpeed:number = 0.1;
        let newZoomValue = cam.zoom + Math.sign(this.input.activePointer.deltaY)*scaleChangeSpeed;

        this._boardViewModel.setZoom(newZoomValue, true);
        p.event.preventDefault();
        p.event.stopPropagation();
    }


    private onGameStateChanged(board: CrosswordBoard): void {
        if(board.gameState==GameStates.gameend)
        {
            this.input.off(Phaser.Input.Events.POINTER_WHEEL, this.onPointerWheel.bind(this));

        }
    }

    private onGotoStartSceneRequsted() {
        this.unsubscribe();
        this.scene.start('Start');
    }

    private unsubscribe(){
        this.input.off(Phaser.Input.Events.POINTER_WHEEL, this.onPointerWheel.bind(this));
        this._boardViewModel.off(BoardViewModel.EVENT_GOTO_START_SCENE, this.onGotoStartSceneRequsted.bind(this), this)
        this.game.scale.off('resize', this.onResize, this);

    }
}