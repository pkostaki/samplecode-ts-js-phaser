import KeyboardController from "./KeyboardController";
import {CrosswordBoard} from "../models/CrosswordBoard";
import GroupCreateConfig = Phaser.Types.GameObjects.Group.GroupCreateConfig;
import {ViewHelper} from "./ViewHelper";
import Color = Phaser.Display.Color;
import Sprite = Phaser.GameObjects.Sprite;
import Rectangle = Phaser.Geom.Rectangle;
import {Cameras} from "../scenes/Cameras";
import BitmapText = Phaser.GameObjects.BitmapText;
import Text = Phaser.GameObjects.Text;
import Pointer = Phaser.Input.Pointer;
import Image = Phaser.GameObjects.Image;
import Vector2 = Phaser.Math.Vector2;

export default class VirtualKeyboardController extends KeyboardController {
    private _buttons: Phaser.GameObjects.Group;
    private _buttonsZone: Rectangle;

    constructor(scene: Phaser.Scene, board: CrosswordBoard) {
        super(scene, board);

    }

    protected initialize():void {
        this._buttonsZone = new Rectangle(0, 0, this._scene.game.canvas.width, this._scene.game.canvas.height);
        this.buildVisual();
        this.invalidateEnabledState();
    }

    protected invalidateEnabledState(): void {
        this._buttons.getChildren().forEach(button => {
            if(this.enabled)
            {
                button.setInteractive();
            }else {
                button.removeInteractive();
            }
        });
        super.invalidateEnabledState();
    }

    private buildVisual() {
        let startLetterCode = this._board.config.charCodesInterval[0];
        let endLetterCode = this._board.config.charCodesInterval[1];

        const extraButtons: Array<{key:string, icon:string, flipX:boolean}> = [
            {key:'TAB', icon:'tab', flipX:false},
            {key:'ARROWLEFT', icon:'right-arrow', flipX:true},
            {key:'ARROWRIGHT', icon:'right-arrow', flipX:false},
            {key:'BACKSPACE', icon:'backspace', flipX:false}
            ];

        const charButtonsCount = endLetterCode - startLetterCode + 1;
        const buttonsCount = charButtonsCount + extraButtons.length;

        this._buttons = this._scene.add.group(<GroupCreateConfig>{
            key: 'pixel1x1',
            quantity: buttonsCount,
        }).setOrigin(0.5);

        const camera = this._scene.cameras.getCamera(Cameras.boardCameraName.toString());
        if (camera) {
            camera.ignore(this._buttons);
        }

        this._buttons.getChildren().forEach((child, index) => {

            let childContent:Sprite = child as Sprite;
            childContent.on(Phaser.Input.Events.POINTER_DOWN, this.onVirtualKeyDown.bind(this, child));
            childContent.setInteractive();
            childContent.setOrigin(0.5);
            let charKey: string;
            let content: BitmapText | Phaser.GameObjects.Text | Image;

            if (index < charButtonsCount) {
                charKey = String.fromCharCode(index + startLetterCode).toUpperCase();
                content = this._scene.add.bitmapText(
                    childContent.x,
                    childContent.y,
                    "crossword_font",
                    charKey,
                    1)
                    .setTintFill(Color.HexStringToColor(this._board.theme.cellLetterTextNonSelectedColor).color)
                    .setOrigin(0.5);

            } else {
                let keyData = extraButtons[index - charButtonsCount];
                charKey = keyData.key;

                content = this._scene.add.image(
                    childContent.x,
                    childContent.y,
                    keyData.icon)
                    .setOrigin(0.5)
                    .setTintFill(Color.HexStringToColor(this._board.theme.cellLetterTextNonSelectedColor).color)
                    content.flipX = keyData.flipX;
            }
            child.setData('symbolContent', content);
            child.setData('charKey', charKey);

            if (camera) {
                camera.ignore(content);
            }
        });

        this.arrangeElements();
    }

    public setViewport(zone: Phaser.Geom.Rectangle) {
        this._buttonsZone = zone;
        this.arrangeElements();
    }

    // private debugRect:Phaser.GameObjects.Rectangle;
    // private debugArea():void {
    //     if (this.debugRect) {
    //         this.debugRect.destroy(true);
    //
    //     }
    //     this.debugRect = this._scene.add.rectangle(0, 0, 100, 1, 0xff0000, 0.5).setOrigin(0);
    //     this.debugRect.x = this._buttonsZone.x;
    //     this.debugRect.y = this._buttonsZone.y;
    //     this.debugRect.displayWidth = this._buttonsZone.width;
    //     this.debugRect.displayHeight = this._buttonsZone.height;
    // }

    private arrangeElements() {
        const marginAround: number = 15;
        const availableArea: Rectangle = new Rectangle(
            this._buttonsZone.x + marginAround,
            this._buttonsZone.y + marginAround,
            this._buttonsZone.width - marginAround * 2,
            this._buttonsZone.height - marginAround * 2);

        let idealCellProportion: number = availableArea.width > availableArea.height
            ? Math.min(availableArea.width / availableArea.height, 3 / 2)
            : Math.max(availableArea.width / availableArea.height, 2 / 3);
        type sizeParamsType = { width: number, height: number, p: number };

        const buttonsCount = this._buttons.getChildren().length;
        const maxRows: number = 4;
        const minRows:number = 2;
        let rowCount = minRows;
        let bestFitProportion = 999999;
        for (let i = minRows; i <= maxRows; i++) {
            let csp: sizeParamsType = {
                width: availableArea.width / (buttonsCount / i),
                height: availableArea.height / i,
                p: 0
            }
            csp.p = csp.width > csp.height ? csp.width / csp.height
                : csp.width / csp.height;
            if (Math.abs(idealCellProportion - csp.p) < bestFitProportion) {
                bestFitProportion = Math.abs(idealCellProportion - csp.p);
                rowCount = i;
            }
        }


        const buttonsInRow = Math.ceil(buttonsCount / rowCount);
        const gridCellWidth: number = Math.floor(availableArea.width / buttonsInRow);
        const gridCellHeight: number = Math.floor(availableArea.height / rowCount);

        Phaser.Actions.GridAlign(this._buttons.getChildren(), {
            width: buttonsInRow,
            height: rowCount,
            cellWidth: gridCellWidth,
            cellHeight: gridCellHeight,
            position: Phaser.Display.Align.LEFT_TOP,
            x: Math.floor(availableArea.x + gridCellWidth + (availableArea.width - buttonsInRow * gridCellWidth) * 0.5),
            y: Math.floor(availableArea.bottom - gridCellHeight * rowCount + gridCellHeight),
        });

        let buttonSize = new Vector2(Math.ceil(gridCellWidth * 0.85), Math.ceil(gridCellHeight * 0.85));

        this._buttons.getChildren().forEach((child, index) => {
            let childContent: Sprite = child as Sprite;
            childContent.setScale(buttonSize.x, buttonSize.y);

            let content: BitmapText | Phaser.GameObjects.Text | Image = child.getData('symbolContent');
            if (!content) {
                return;
            }
            const contentSize: number = Math.min(childContent.displayWidth, childContent.displayHeight) * 0.7;

            content.x = childContent.x;
            content.y = childContent.y;
            if (content instanceof BitmapText) {
                content.setFontSize(contentSize / ViewHelper.devicePixelRatio);

            } else if (content instanceof Text) {
                content.setFontSize(contentSize);

            } else if (content instanceof Image) {
                content.setScale(contentSize / content.width);
            }
        });
    }

    private onVirtualKeyDown(child:Sprite, pointer:Pointer) {
        let charKey:string = child.getData('charKey') as string;
        if(charKey==undefined||charKey==null)
        {
            return;
        }
        this.processKey(charKey, false);

    }


}