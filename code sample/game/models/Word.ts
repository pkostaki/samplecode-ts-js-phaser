import EventEmitter = Phaser.Events.EventEmitter;
import {LetterCell} from "./LetterCell";

export class Word extends EventEmitter{
    get lockOnValid(): boolean {
        return this._lockOnValid;
    }

    set lockOnValid(value: boolean) {
        this._lockOnValid = value;
    }
    private _lockOnValid:boolean = true;
    public static EVENT_VALID_STATUS_CHANGED:string = "EVENT_VALID_STATUS_CHANGED";

    public cells: Array<LetterCell> = new Array<LetterCell>();
    public value: string;
    public question: string;
    public num: integer;

    constructor(value: string, question: string, num: integer) {
        super();
        this.value = value;
        this.question = question;
        this.num = num;
    }

    private _selected:boolean;

    get selected(): boolean {
        return this._selected;
    }

    set selected(value: boolean) {
        if(this._selected == value)
        {
            return;
        }

        this._selected = value;
        this.cells.forEach(cell => cell.selected = this._selected);

        // if(this._selected) {
        //     let index = this.getFirstAppropriateEditableCellIndex(0, false, true);
        //     this.editCellByIndex(index);
        // }
        this.emit('selected', this);
    }

    public editFirstApproptiateCell():boolean
    {
        if(!this.selected)
        {
            return false;
        }

        let index = this.getFirstAppropriateEditableCellIndex(0, false, true);
        this.editCellByIndex(index);
        return true;
    }

    public editCellByIndex(index:integer):void{
        this.cells.forEach(value1 => {value1.editableNow = false;});
        this.cells[index].editableNow = true;
    }

    public getEditableCell():LetterCell|undefined
    {
        return this.cells.find(c=>c.editableNow);
    }

    public getEditableIndex():integer
    {
        return this.cells.findIndex(c=>c.editableNow);
    }

    /*
    Edit next cell after current. If current doesn't  editable then start from first letter
     */
    public editNextCell(backward:boolean):boolean {
         let editableIndex = this.getEditableIndex();
         if(editableIndex==-1)
         {
             editableIndex = 0;
         }
         let nextEditableIndex = this.getNextEditableCellIndex(editableIndex, backward, true);
         if(nextEditableIndex==-1)
         {
             nextEditableIndex = editableIndex;
         }
         this.editCellByIndex(nextEditableIndex);
         return true;
    }

    /*
    Return index of next cell after current which available for editing. If now appropriate cell was found return currentEditableIndex
     */
    public getFirstAppropriateEditableCellIndex(indexFrom:number, backward:boolean, shouldSkipLocked:boolean):integer {
        let editableIndex = indexFrom;
        if(this.cells[editableIndex].locked)
        {
            editableIndex =this.getNextEditableCellIndex(indexFrom, backward, shouldSkipLocked);
            if(editableIndex==-1)
            {
                editableIndex = indexFrom;//return same index
            }
        }
        return editableIndex;
    }

    /*
    Return index of next cell after current which available for editing. If now appopriate cell was found return currentEditableIndex
     */
    public getNextEditableCellIndex(currentEditableIndex:number, backward:boolean, shouldSkipLocked:boolean):integer {
        // console.log(`[getNextEditableCellIndex] currentEditableIndex: ${currentEditableIndex} backward: ${backward} shouldSkipLocked: ${shouldSkipLocked}`);
        let nextEditableIndex;
        let steps = 0;
        let outOfCellsReason = false;
        do {
            if (backward) {
                nextEditableIndex = currentEditableIndex == 0 ? this.cells.length - 1 : currentEditableIndex - 1;
            } else {
                nextEditableIndex = currentEditableIndex == this.cells.length - 1 ? 0 : currentEditableIndex + 1;
            }

            currentEditableIndex = nextEditableIndex;
            steps++;

            outOfCellsReason = steps >= this.cells.length-1;
        } while (!outOfCellsReason && (shouldSkipLocked && this.cells[nextEditableIndex].locked));

        return outOfCellsReason?-1:nextEditableIndex;
    }

    /*
    enter letter to current editable cell
     */
    public enterLetter(char: string):boolean {
        if(this.lockOnValid&&this.isValid)
        {
            return false;
        }

        let editableCell = this.getEditableCell();
        if(editableCell==undefined||editableCell.locked)
        {
            return false;
        }

        editableCell.enteredChar = char;
        this.validate();
        return true;
    }

    /*
    Delete all letters
     */
    public deleteAllLetters():void
    {
        if(this.lockOnValid&&this.isValid)
        {
            return;
        }
        this.cells.forEach(value1 => {
            if(!value1.locked){
                value1.enteredChar = "";
            }
        });
        this.validate();
    }

    /*
    Delete char at current editable cell
     */
    public deleteLetter():boolean {
        if(this.lockOnValid&&this.isValid)
        {
            return false;
        }

        let editable = this.getEditableCell();
        if(editable==undefined || editable.locked|| !editable.containChar)
        {
            return false;
        }

        editable.enteredChar = "";
        this.validate();
        return true;
    }

    public get isValid():boolean
    {
        return this.cells.find(cell => !cell.isValid )==null;
    }

    private _isValid:boolean;

    private validate() {
        // console.log(`validate _isValid: ${this._isValid} isValid: ${this.isValid}`);
        if(this._isValid == this.isValid)
        {
            return;
        }
        this._isValid = this.isValid;
        if(this.isValid && this.lockOnValid)
        {
            this.cells.forEach(cell => cell.locked = true);
        }
        this.emit(Word.EVENT_VALID_STATUS_CHANGED, this);
    }

    public resetWord():void {
        this.cells.forEach(cell =>{
            cell.enteredChar = "";
            cell.locked = false;
        })
    }


}