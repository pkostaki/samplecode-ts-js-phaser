import {Word} from "./Word";
import EventEmitter = Phaser.Events.EventEmitter;
import {ApplicationTheme} from "../theme/ApplicationTheme";

export class BaseCell extends EventEmitter{
    public column:integer = -1;
    public row:integer=-1;
    public theme:ApplicationTheme;

    constructor(column: integer, row: integer, theme:ApplicationTheme) {
        super();
        this.column = column;
        this.row = row;
        this.theme = theme;
    }

}

export class LetterCell extends BaseCell {
    get char(): string {
        return this._char;
    }

    set char(value: string) {
        if(this.locked)
        {
            return;
        }
        this._char = value;
    }
    get locked(): boolean {
        return this._locked;
    }

    set locked(value: boolean) {
        this._locked = value;
    }
    private _locked:boolean;

    public get isValid(): boolean {
        return this._enteredChar === this._char;
    }

    public get containChar(): boolean {
        return this.enteredChar != "";
    };

    get enteredChar(): string {
        return this._enteredChar;
    }

    set enteredChar(value: string) {
        if (this._enteredChar == value) {
            return;
        }

        this._enteredChar = value;
        this.emit('letterChanged', this);
    }

    private _editableNow: boolean = false;

    get editableNow(): boolean {
        return this._editableNow;
    }

    set editableNow(value: boolean) {
        if (this._editableNow == value) {
            return;
        }
        this._editableNow = value;
        if (this._editableNow && !this._selected) {
            this.selected = true;
        }
        this.emit("editable", this);
    }

    private _selected: boolean = false;

    get selected(): boolean {
        return this._selected;
    }

    set selected(value: boolean) {
        // console.log(`cell selected:${value} prev:${this._selected} char:${this._char} linked words:${this.linkedWords.length} `);
        if (this._selected == value) {
            return;
        }

        this._selected = value;
        this.emit('selected', this);
        if (!this._selected) {
            this.editableNow = false;
        }
    }

    get num(): integer {
        return this._num;
    }

    get linkedWords(): Array<Word> {
        return this._linkedWords;
    }

    set linkedWords(value: Array<Word>) {
        this._linkedWords = value;
    }

    private _char: string = "";
    private _enteredChar: string = "";
    private _linkedWords: Array<Word> = new Array<Word>();

    private _num: integer = -1;

    constructor(column: integer, row: integer, char: string, num: integer, theme:ApplicationTheme) {
        super(column, row, theme);
        this._char = char;
        this._num = num;
    }

}
