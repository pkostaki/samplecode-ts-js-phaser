import {CellViewModel} from "./CellViewModel";
import {Word} from "../models/Word";
import Color = Phaser.Display.Color;

export class WordViewModel {
    get cellsViewModels(): Array<CellViewModel> {
        return this._cellsViewModels;
    }

    set cellsViewModels(value: Array<CellViewModel>) {
        this._cellsViewModels = value;
    }
    private _scene: Phaser.Scene;
    private _word: Word;
    private _cellsViewModels:Array<CellViewModel> = new Array<CellViewModel>();

    constructor(scene: Phaser.Scene, word: Word) {
        this._scene = scene;
        this._word = word;
        this._word.on(Word.EVENT_VALID_STATUS_CHANGED, this.onWordValidStatusChanged.bind(this));
    }

    private onWordValidStatusChanged(word:Word) {
        console.log(`onWordValidStatusChanged word.isValid: ${word.isValid}`);
        if(!word.isValid)
        {
            return;
        }

        this._cellsViewModels.forEach((cell, index) => {
            let targetScaleX = cell.background.scaleX;
            let targetScaleY = cell.background.scaleY;
            this._scene.tweens.add({
                targets: cell.background,
                props:{
                    scaleX: {getStart: target => 0, getEnd: target =>  targetScaleX},
                    scaleY: {getStart: target => 0, getEnd: target => targetScaleY},
                    angle:  {getStart: target => 0, getEnd: target => 360},
                },
                duration:200,
                ease:'Sine.easeInOut',

               delay: index * 50,
                repeat: 0,
                yoyo: false,
                hold: 10,
                repeatDelay: 0
            });




            this._scene.tweens.addCounter({
                from: 0,
                to: 100,
                duration: 300,
                delay: index * 50,

                onUpdate: function (tween)
                {
                    // var value = Math.floor(tween.getValue());

                var tint = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Color.IntegerToColor( cell.text.tint),
                    Color.HexStringToColor(cell.cell.theme.cellLetterTextValidColor),
                        100,
                tween.getValue());

                cell.text.setTintFill(Color.ObjectToColor(tint).color);
                }
            });
        });
    }
}