import EventEmitter = Phaser.Events.EventEmitter;
import {Word} from "./Word";
import {LetterCell} from "./LetterCell";
import {ApplicationTheme} from "../theme/ApplicationTheme";
import {ICrosswordData} from "../../data/ICrosswordData";

enum WordDirection {
    vertical=0,
    horizontal=1
}

export class BoardConfig {
    public charCodesInterval:Array<integer> = ['А'.charCodeAt(0), 'Я'.charCodeAt(0)];
}

export enum GameStates {
    none,
    intro,
    gameplay,
    gameend
}

export class CrosswordBoard extends EventEmitter {

    get maximumCellRow(): number {
        return this._maximumCellRow;
    }

    get minimumCellRow(): number {
        return this._minimumCellRow;
    }

    get maximumCellColumn(): number {
        return this._maximumCellColumn;
    }

    get minimumCellColumn(): number {
        return this._minimumCellColumn;
    }

    get gameState(): GameStates {
        return this._gameState;
    }

    set gameState(value: GameStates) {
        if(this._gameState == value)
        {
            return;
        }

        this._gameState = value;
        this.emit(CrosswordBoard.EVENT_ON_STATE_CHANGED, this);
    }

    public static EVENT_SELECT_WORD_ON_BOARD:string = "EVENT_SELECT_WORD_ON_BOARD";
    public static EVENT_ALL_WORDS_VALID:string = "EVENT_ALL_WORDS_VALID";
    public static EVENT_ON_STATE_CHANGED:string = "EVENT_ON_STATE_CHANGED";
    private _cells:Array<LetterCell> = new Array<LetterCell>();
    public words:Array<Word> = new Array<Word>();
    public theme:ApplicationTheme ;
    public config: BoardConfig = new BoardConfig();
    public get gameCompleted():boolean{return this._gameState==GameStates.gameend;}
    private _gameState:GameStates;

    private _minimumCellColumn = 99999;
    private _maximumCellColumn = -9999;
    private _minimumCellRow = 99999;
    private _maximumCellRow = -9999;

    constructor(theme:ApplicationTheme) {
        super();
        this.theme = theme;
        this.gameState = GameStates.gameplay;
    }

    // public stubInitialize()
    // {
    //     this.addWord(2,"УЖИН","Праздничный ...", 5,3, WordDirection.horizontal);
    //     this.addWord(123,"ЖЕНА","Муж и ... одна сатана", 6,3, WordDirection.vertical);
    //     this.addWord(3,"НЕБО","Выше Земли", 6,5, WordDirection.horizontal);
    //     this.addWord(4,"НАБЛЮДАТЕЛЬ","Подсчитывает голоса на выборах", 8,3, WordDirection.vertical);
    //     this.addWord(5,"АРЛЕКИН","Персонаж сказки А. Н. Толстого «Золотой ключик, или Приключения Буратино»", 6,6, WordDirection.horizontal);
    //     console.log(`minimumCellColumn: ${this.minimumCellColumn} maximumCellColumn: ${this.maximumCellColumn} minimumCellRow: ${this.minimumCellRow} maximumCellRow: ${this.maximumCellRow}` )
    //
    // }

    public initialize(crosswordData: ICrosswordData) {
        crosswordData.words.forEach(word => {
            const pos = word.startPos.split(',');
            this.addWord(parseInt(word.num), word.word.toUpperCase(), word.question, parseInt(pos[0]), parseInt(pos[1]), word.horizontal === '0' ? WordDirection.vertical : WordDirection.horizontal);
        });
    }

    public addWord(num:integer, wordStr:string, question:string, column:integer, row:integer, direction:WordDirection):void{
        let word = new Word(wordStr, question, num);
        for(let letterIndex=0; letterIndex< wordStr.length; letterIndex++)
        {
            let letter = wordStr[letterIndex];
            let letterCol = direction==WordDirection.horizontal? column+letterIndex: column;
            let letterRow = direction==WordDirection.horizontal? row:row+letterIndex;
            let cell = this.getCell(letterCol, letterRow);
            // console.log(`word:${wordStr} getCell pos:${letterCol} ${letterRow} cell: ${cell}`);
            if(cell!=undefined)
            {
                if(cell.char!=letter)
                {
                    throw new Error(`Crossword has invalid letter: ${letterRow} pos:${letterCol};${letterRow}`);
                }
            }
            else
            {
                cell = this.createCell(letter, letterCol, letterRow, letterIndex==0? num:-1);
            }
            this.updateExtremeIndexes(cell.column, cell.row);
            cell.linkedWords.push(word);
            word.on(Word.EVENT_VALID_STATUS_CHANGED, this.onWordValidStatusChanged.bind(this));
            word.cells.push(cell);
        }

        this.words.push(word);
    }

    private getCell(letterCol: number, letterRow: number):LetterCell|undefined {
        return this._cells.find(cell=> cell.column==letterCol&&cell.row ==letterRow);
    }

    private createCell(letter: string, letterCol: number, letterRow: number, num:number) {
        let cell =  new LetterCell(letterCol, letterRow, letter, num, this.theme);
        this._cells.push(cell);
        return cell;
    }

    /*
    Delete current word. After deletion set first not locked cell(or first cell if all letters are locked) as editable
     */
    public deleteWord():void{
        let word = this.getSelectedWord();
        if(word==undefined)
        {
            return;
        }
        word.deleteAllLetters();
        let nextEditableIndex = word.getFirstAppropriateEditableCellIndex(0, false, true);
        if(nextEditableIndex==-1){
            nextEditableIndex = 0;
        }
        word.editCellByIndex(nextEditableIndex);
    }

    public getSelectedWord():Word|undefined {
        return this.words.find(w => w.selected);
    }

    private selectWordInternal(word:Word):boolean
    {
        if(word.selected)
        {
            return false;
        }

        this.resetSelection();
        word.selected = true;
        word.editFirstApproptiateCell();
        this.emit(CrosswordBoard.EVENT_SELECT_WORD_ON_BOARD, word);
        return true;
    }

    public selectCellByClick(cell: LetterCell) {
        //try select cell at selected cell
        //try select select connected word and cell
        let selectedWord = this.getSelectedWord();
        if (selectedWord != undefined) {
            let ci = selectedWord.cells.indexOf(cell);
            if (ci != -1) {
                if (!cell.editableNow) {
                    selectedWord.editCellByIndex(ci);
                    return;
                }
            }
        }

        let notSelectedLinkedWord = cell.linkedWords.find(w => !w.selected);
        if (!notSelectedLinkedWord) {
            return;
        }

        let selectedChanged = this.selectWordInternal(notSelectedLinkedWord);
        if (selectedChanged) {
            let cellIndexAtWord = notSelectedLinkedWord.cells.indexOf(cell);
            if (cellIndexAtWord >= 0) {
                notSelectedLinkedWord.editCellByIndex(cellIndexAtWord);
            }
        }
    }

    /*
    Select word
     */
    public selectWord(word: Word):void {
        this.selectWordInternal(word);
    }

    public goNextWord(backward:boolean):void
    {
        let nextWordIndex =0;
        let word = this.getSelectedWord();
        if(word!=undefined) {
            let wordIndex = this.words.indexOf(word);
            if(backward)
            {
                nextWordIndex = wordIndex == 0? this.words.length-1:wordIndex-1;
            }
            else
            {
                nextWordIndex = wordIndex == this.words.length-1? 0: wordIndex+1;
            }
        }
        let selectedChanged = this.selectWordInternal(this.words[nextWordIndex]);

    }

    /*
    Enter letter
     */
    public enterLetter(char:string):void{
        // console.log(`enterChar char:${char}`);
        let word = this.getSelectedWord();
        if(word==undefined)
        {
            return;
        }

        if(word.enterLetter(char)){
            if (word.isValid)
            {
                this.goNextWord(false);
                return;
            }

            let moved = word.editNextCell(false);

        }
    }

    /*
    * Delete letter
    * */
    public deleteLetter(backward:boolean):void{
        // console.log(`deleteChar moveBackward:${backward}`);
        let word = this.getSelectedWord();
        if(word==undefined)
        {
            return;
        }

        let deleted = word.deleteLetter();
        if(backward)
        {
            if (!deleted)
            {
                word.editNextCell(true);
            }
        }
    }

    public goToNextLetter(backward:boolean):void
    {
        // console.log(`moveToNextLetter backward: ${backward}`);
        let word = this.getSelectedWord();
        if(word==undefined)
        {
            return;

        }

        word.editNextCell(backward);
    }

    private resetSelection() {
        this.words.forEach(word => word.selected = false);
    }


    private onWordValidStatusChanged(word:Word) {
        if(!this.isAllWordsValid())
        {
            return;
        }
        this.emit(CrosswordBoard.EVENT_ALL_WORDS_VALID, this)
        this.gameState = GameStates.gameend;
    }

    private isAllWordsValid():boolean
    {
        return this.words.find(value => !value.isValid)==null;
    }

    private updateExtremeIndexes(column: integer, row: integer) {
        if(column> this._maximumCellColumn)
        {
            this._maximumCellColumn = column;
        }

        if(column < this._minimumCellColumn)
        {
            this._minimumCellColumn = column;
        }

        if(row> this._maximumCellRow)
        {
            this._maximumCellRow = row;
        }

        if(row < this._minimumCellRow)
        {
            this._minimumCellRow = row;
        }
    }


    public resetBoard(): void {
        this.words.forEach(value => value.resetWord())
        this.resetSelection();
    }

    public revealEditableLetter():void {
        const word = this.getSelectedWord();
        if(word==undefined)
        {
            return;
        }
        let cell = word.getEditableCell();
        if(cell==undefined)
        {
            return;
        }

        this.enterLetter(cell.char);
    }
}




