import EventEmitter = Phaser.Events.EventEmitter;
import {CrosswordBoard} from "../models/CrosswordBoard";

export class BaseKeyboardController  extends EventEmitter{

    protected _scene: Phaser.Scene;
    protected _board: CrosswordBoard;

    constructor(scene: Phaser.Scene, board: CrosswordBoard) {
        super();
        this._scene = scene;
        this._board = board;
        this.initialize();
    }

    protected initialize():void
    {

    }

    get enabled(): boolean {
        return this._enabled;
    }

    set enabled(value: boolean) {
        if(this.enabled == value)
        {
            return;
        }

        this._enabled = value;
        this.invalidateEnabledState();
    }
    private _enabled:boolean = true;

    protected invalidateEnabledState() {

    }

    protected processKey(key: string, shiftKey: boolean): boolean {
        key = key.toUpperCase();
        if (key == "BACKSPACE") {
            this._board.deleteLetter(true);
            return true;
        }
        if (key == "DELETE") {
            this._board.deleteLetter(false);
            return true;
        }
        if (key == "SPACE") {
            this._board.deleteWord();
            return true;
        }

        if (key == "TAB") {
            this._board.goNextWord(shiftKey);
            return true;
        }

        if (key == "ARROWLEFT" || key == "ARROWUP") {
            this._board.goToNextLetter(true);
            return true;
        }
        if (key == "ARROWRIGHT" || key == "ARROWDOWN") {
            this._board.goToNextLetter(false);
            return true;
        }

        if (key.length == 1) {
            let keyCode = key.charCodeAt(0);
            if (this._board.config.charCodesInterval[0] <= keyCode && keyCode <= this._board.config.charCodesInterval[1]) {
                this._board.enterLetter(key);
                return true;
            }
        }
        return false;
    }
}

export default class KeyboardController extends BaseKeyboardController {

    constructor(scene: Phaser.Scene, board: CrosswordBoard) {
        super(scene, board);
    }

    protected initialize():void
    {
        this.invalidateEnabledState();
    }

    protected invalidateEnabledState() {
        if (this.enabled) {
            this._scene.input.keyboard.on('keydown', this.onKeyDown, this);
        } else {
            this._scene.input.keyboard.off('keydown', this.onKeyDown, this);
        }
    }


    private onKeyDown(event: KeyboardEvent) {
       // console.log(`Keyboard onKeyDown code: ${event.code} key: ${event.key}}  `);
        if(this.processKey(event.key, event.shiftKey))
        {
            event.preventDefault();
            event.stopPropagation();
            return
        }
    }



}