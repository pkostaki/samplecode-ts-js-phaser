import Text = Phaser.GameObjects.Text;
import Scene = Phaser.Scene;
import Sprite = Phaser.GameObjects.Sprite;
import Color = Phaser.Display.Color;
import EventEmitter = Phaser.Events.EventEmitter;
import Pointer = Phaser.Input.Pointer;
import {GameObjPool} from "./GameObjPool";
import {LetterCell} from "../models/LetterCell";
import BitmapText = Phaser.GameObjects.BitmapText;
import {ViewHelper} from "./ViewHelper";

export class CellViewModel extends EventEmitter {
    get cell(): LetterCell {
        return this._cell;
    }

    get background(): Sprite {
        return this._background;
    }

    get text(): Text|BitmapText {
        return this._text;
    }

    private _cell: LetterCell;
    private _scene: Scene;
    private _background: Sprite;
    private _selectedLetterMark: Sprite|null;
    private _text: Phaser.GameObjects.BitmapText|Text;
    private _textNum: BitmapText|Text;
    private _cellWidth: number;
    private _cellHeight: number;
    private _cellMarginAround: number;


    constructor(scene: Phaser.Scene, cell: LetterCell, cellWidth: number, cellHeight: number, cellMarginAround:number) {
        super();
        this._scene = scene;
        this._cell = cell;
        this._cellWidth = cellWidth;
        this._cellHeight = cellHeight;
        this._cellMarginAround = cellMarginAround;
        this._cell.on("selected", this.onCellSelected, this);
        this._cell.on("editable", this.onCellEditable, this);
        this._cell.on("letterChanged", this.onCellLetterChanged, this);
        this.initialize();
        this.positining();
    }


    private initialize() {
        this._background = new Sprite(this._scene, 0, 0, 'pixel1x1');
        this._background.setOrigin(0.5);
        this._background.scaleX = this._cellWidth;
        this._background.scaleY = this._cellHeight;
        this._background.setInteractive();
        this._scene.add.existing(this._background);

        this._background.on("pointerdown", this.onPointerDown, this);



        this._text = this._scene.add.bitmapText(0, 0, 'crossword_font',this._cell.char, 16)
            .setTintFill(Color.HexStringToColor(this.cell.theme.cellLetterTextNonSelectedColor).color)
            .setOrigin(0.5);
        let fontSizeLetter = ViewHelper.calculateBitmapFontSize(this._text as BitmapText, this._cellHeight * 0.81);
        this._text.setFontSize(fontSizeLetter);
        // console.log(`fontSizeLetter: ${fontSizeLetter}  cellHeight: ${this._cellHeight}`);


        if (this._cell.num != -1) {
            //position will calculate further
            this._textNum = this._scene.add.bitmapText(0, 0,'crossword_font_small', this._cell.num.toString(), 10)
                .setOrigin(0, 0)
                .setTintFill(Color.HexStringToColor(this._cell.theme.cellNumTextColor).color);
            let fontSizeNum = ViewHelper.calculateBitmapFontSize(this._textNum as BitmapText, this._cellHeight*0.35);
            this._textNum.setFontSize(fontSizeNum);
        }

        this.invalidateState();

        let camera = this._scene.cameras.main;
        camera.ignore([this._background]);
        if(this.text)
        {
            camera.ignore(this._text);
        }
        if (this._textNum) {
            camera.ignore(this._textNum);
        }
        if(this._selectedLetterMark)
        {
            camera.ignore(this._selectedLetterMark);
        }
    }

    public positining(): void {
        let x = this.getXcoor();
        let y = this.getYcoor();

        this._background.x = x;
        this._background.y = y;

        if(this.text) {
            this._text.x = x;
            this._text.y = y;
        }

        if (this._textNum != null) {
            let shift = this._cellWidth*0.45;
            this._textNum.x = Math.ceil(x - shift);
            this._textNum.y = Math.ceil(y - shift);
        }
    }

    public getYcoor() {
        let cellHeight = this._cellHeight + this._cellMarginAround;
        let y = this._cell.row * cellHeight;
        return y;
    }

    public getXcoor() {
        let cellWidth = this._cellWidth + this._cellMarginAround;
        let x = this._cell.column * cellWidth;
        return x;
    }
    public getWidth(){
        return this._cellWidth + this._cellMarginAround;
    }
    private onCellSelected(cell: LetterCell) {
        this.invalidateState();
    }

    private onCellEditable(cell: LetterCell) {
        this.invalidateState();
    }

    private onCellLetterChanged(cell: LetterCell) {
        this.invalidateState();
    }

    private invalidateState() {
        let colors:any = CellViewHelper.getColors(this);
        this.invalidateBackgroundView(colors.backgroundColor);
        this.invalidateTextView(colors.textColor);
        // console.log(`char: ${this.cell.char} editableNow: ${this.cell.editableNow} _selectedLetterMark: ${this._selectedLetterMark}`);
        if (this.cell.editableNow) {
            if (this._selectedLetterMark == null) {
                this.createSelectedLetterMark();
            }
        } else {
            this.removeSelectedLetterMark();
        }
    }

    private invalidateBackgroundView(backColor:string) {
        //todo maybe add transition anims
        this._background.setTintFill(Color.HexStringToColor(backColor).color);
    }

    private invalidateTextView(color:string) {
        this._text.visible = this.cell.containChar;
        this._text.setTintFill(Color.HexStringToColor(color).color);
        if (this.cell.containChar) {
            this._text.text = this.cell.enteredChar;
        }
    }

    private onPointerDown(pointer: Pointer) {
        this.emit('selected', this);
    }

    private removeSelectedLetterMark() {
        if (this._selectedLetterMark == null) {
            return;
        }
        // GameObjPool.Pool.add(this._selectedLetterMark);
        GameObjPool.Pool.killAndHide(this._selectedLetterMark);
        this._selectedLetterMark = null;
    }

    private createSelectedLetterMark() {
        let content: Sprite;
        if (GameObjPool.Pool.getLength() > 0) {
            content = GameObjPool.Pool.getFirst();
            content.active = true;
            content.visible = true;
        } else {
            content = new Sprite(this._scene, 0, 0, 'pixel1x1');
            content.setOrigin(0.5);
            content.disableInteractive();
            content.scaleX = this._cellWidth * 0.8;
            content.scaleY = this._cellHeight * 0.04;
            content.setTintFill(Color.HexStringToColor(this._cell.theme.cellSelectedMarkColor).color);
            GameObjPool.Pool.add(content);
        }
        content.x = this.getXcoor();
        content.y = this.getYcoor() + this._cellHeight * 0.46;
        this._selectedLetterMark = content;
        this._scene.add.existing(this._selectedLetterMark);
        this._scene.cameras.main.ignore(this._selectedLetterMark);
    }
}

class CellViewHelper {
    static getColors(view:CellViewModel):object
    {
        let theme = view.cell.theme;
        let result = {backgroundColor:"", textColor:""};

        if(view.cell.locked) {
            if (view.cell.isValid) {

                result.backgroundColor = theme.cellBackgroudNonSelectedFilledColor;
                result.textColor = theme.cellLetterTextValidColor;
                return result;
            }
        }

        if(view.cell.selected)
        {
            if(view.cell.editableNow)
            {
                result.backgroundColor = theme.cellBackgroudSelectedEditableNowColor;
                result.textColor = theme.cellLetterTextEditableNowColor;
            }
            else
            {
                result.backgroundColor = view.cell.containChar? theme.cellBackgroudSelectedFilledColor: theme.cellBackgroudSelectedNotFilledColor;
                result.textColor = theme.cellLetterTextSelectedColor;
            }
            return  result;
        }

        // here not selected word
        let brightenRandomizePercent = view.cell.theme.cellBackgroudSelectedNotFilledRandomizeBrightenPercent;
        let closedCellColor =  brightenRandomizePercent>0? Color.ComponentToHex(Color.HexStringToColor(theme.cellBackgroudNonSelectedNotFilledColor).brighten(Math.floor(Math.random()*brightenRandomizePercent)).color)
        :theme.cellBackgroudNonSelectedNotFilledColor;

        result.backgroundColor = view.cell.containChar? theme.cellBackgroudNonSelectedFilledColor: closedCellColor;
        result.textColor = theme.cellLetterTextNonSelectedColor;

        return  result;

    }
}

