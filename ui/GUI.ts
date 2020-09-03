import KeyboardController, {BaseKeyboardController} from "./KeyboardController";
import {ListView, ListViewDirection, ListViewItemsAlign} from "./ListView";
import {CrosswordBoard} from "../models/CrosswordBoard";
import {ViewHelper} from "./ViewHelper";
import VirtualKeyboardController from "./VirtualKeyboardController";
import {QuestionListItemView} from "./QuestionListItemView";
import {ButtonListItemView} from "./ButtonListItemView";
import EventEmitter = Phaser.Events.EventEmitter;
import Rectangle = Phaser.Geom.Rectangle;

export class GUI extends EventEmitter {
    get keyboard(): BaseKeyboardController {
        return this._keyboard;
    }

    get questionsList(): ListView {
        return this._questionsList;
    }

    get boardZone(): Phaser.Geom.Rectangle {
        return this._boardZone;
    }

    get questionZone(): Phaser.Geom.Rectangle {
        return this._questionZone;
    }

    protected _boardCamera: Phaser.Cameras.Scene2D.Camera;
    protected _board: CrosswordBoard;
    protected _keyboard: BaseKeyboardController;
    protected _questionZone: Rectangle = new Rectangle();
    protected _boardZone: Rectangle = new Rectangle();
    protected _buttonsZone: Rectangle = new Rectangle();
    protected _questionsList: ListView;
    protected _buttonsList: ListView;
    protected _scene: Phaser.Scene;

    constructor(scene: Phaser.Scene, boardCamera: Phaser.Cameras.Scene2D.Camera, board: CrosswordBoard) {
        super();
        this._scene = scene;
        this._boardCamera = boardCamera;
        this._board = board;
        this.createQuestionContainer();
        this.createButtonsList();
        this.createKeyboardController();
        this.resize(this._scene.game.canvas.width, this._scene.game.canvas.height);
    }

    protected createKeyboardController()
    {
        this._keyboard = new KeyboardController(this._scene, this._board);
    }

    private createQuestionContainer() {
        this._questionsList = new ListView(this._scene);
        let questionsData = this._board.words;

        this._questionsList.initialize(
            this._questionZone.x,
            this._questionZone.y,
            this._questionZone.width,
            this._questionZone.height,
            questionsData,
            (data: any, index: number) => {
                let itemView = new QuestionListItemView(this._scene);
                itemView.data = data;
                itemView.createView(data, this._boardCamera, index, this._board.theme);
                return itemView;
            },
            ListViewDirection.vertical,
            ListViewItemsAlign.begin,
            0);
    }

    private createButtonsList():void {
        this._buttonsList = new ListView(this._scene);
        //todo maybe define type?!
        const buttons: Array<{ icon: string, action: Function }> = [
            {
                icon: "menu", action: function () {
                    this._scene.scene.start('Start');
                }.bind(this)
            },
            {
                icon: "reload", action: function () {
                    this._board.resetBoard();
                }.bind(this)
            },

            {
                icon: "open", action: function () {
                    this._board.revealEditableLetter();
                }.bind(this)
            }

        ]
        this._buttonsList.initialize(this._buttonsZone.x, this._buttonsZone.y, this._buttonsZone.width, this._buttonsZone.height,
            buttons, (data: any, index: number) => {
                let itemView = new ButtonListItemView(this._scene);
                itemView.createView(data, this._boardCamera, index, this._board.theme);
                return itemView;
            },
            ListViewDirection.vertical,
            ListViewItemsAlign.begin,
            12
        );
    }

    resize(width: number, height: number) {
        this.calculateSizeDependsParams(width, height);
    }

    protected calculateSizeDependsParams(width: number, height: number) {
        let isHorizontalLayout = ViewHelper.isHorizontalLayout(width, height);
        if (isHorizontalLayout) {
            this._buttonsZone = new Rectangle(12, 12, 40,Math.floor(height));
            this._boardZone = new Rectangle(this._buttonsZone.right, 0, Math.round(width * 2 / 3 - this._buttonsZone.right), Math.round(height));
            this._questionZone = new Rectangle(this._boardZone.right, 0, Math.round(width - this._boardZone.right), Math.round(height) );
        } else {
            this._buttonsZone = new Rectangle(12, 12, 40,Math.floor(height*2/3));
            this._boardZone = new Rectangle(this._buttonsZone.right, 0, Math.round(width - this._buttonsZone.right), Math.round(height * 2 / 3));
            this._questionZone = new Rectangle(0, this._boardZone.bottom, Math.round(width), Math.round(height - this._boardZone.bottom));
        }

        console.log(`calculateSizeDependsParams 
                        width: ${width} 
                        height: ${height}  
                        bzl: ${this._boardZone.left} 
                        bzw: ${this._boardZone.width}`);
        this._boardCamera.setViewport(this._boardZone.x, this._boardZone.y, this._boardZone.width, this._boardZone.height);
        this._questionsList.setViewport(this._questionZone.x, this._questionZone.y, this._questionZone.width, this._questionZone.height);
        this._buttonsList.setViewport(this._buttonsZone.x, this._buttonsZone.y, this._buttonsZone.width, this._buttonsZone.height);
    }
}

export class DesktopGUI extends GUI {

}

export class MobileGUI extends GUI {

    private _keyboardZone:Rectangle;

    protected createKeyboardController()
    {
        this._keyboard = new VirtualKeyboardController(this._scene, this._board);
    }

    protected calculateSizeDependsParams(width: number, height: number) {
        let isHorizontalLayout = ViewHelper.isHorizontalLayout(width, height);

        this._buttonsZone = new Rectangle(12, 12, 50,Math.floor(height*0.5));
        if (isHorizontalLayout) {
            this._boardZone = new Rectangle(this._buttonsZone.right, 0, Math.round(width * 0.5), this._buttonsZone.height);
            this._questionZone = new Rectangle(this._boardZone.right, 0, Math.round(width - this._boardZone.right), this._buttonsZone.height);
            this._keyboardZone = new Rectangle(0, this.boardZone.bottom, Math.round(width), Math.round(height - this._buttonsZone.bottom ));
        } else {
            this._boardZone = new Rectangle(this._buttonsZone.right, 0, Math.round(width - this._buttonsZone.right), this._buttonsZone.height);
            this._questionZone = new Rectangle(0, this._boardZone.bottom, Math.round(width), Math.round((height - this._buttonsZone.bottom)*1/4));
            this._keyboardZone = new Rectangle(0, this._questionZone.bottom, Math.round(width), Math.round((height - this._buttonsZone.bottom)*3/4));
        }

        console.log(`calculateSizeDependsParams 
                        width: ${width} 
                        height: ${height}  
                        bz: ${this._boardZone.x}, ${this._boardZone.y}, ${this._boardZone.width}, ${this._boardZone.height} 
                        qz: ${this._questionZone.x}, ${this._questionZone.y}, ${this._questionZone.width}, ${this._questionZone.height} 
                        kz: ${this._keyboardZone.x}, ${this._keyboardZone.y}, ${this._keyboardZone.width}, ${this._keyboardZone.height} 
                        `);

        this._boardCamera.setViewport(this._boardZone.x, this._boardZone.y, this._boardZone.width, this._boardZone.height);
        this._questionsList.setViewport(this._questionZone.x, this._questionZone.y, this._questionZone.width, this._questionZone.height);
        this._buttonsList.setViewport(this._buttonsZone.x, this._buttonsZone.y, this._buttonsZone.width, this._buttonsZone.height);
        (this.keyboard as VirtualKeyboardController).setViewport(this._keyboardZone);
    }
}

