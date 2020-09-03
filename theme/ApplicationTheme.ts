export class ApplicationTheme {

    public modeWeb:number = Phaser.Scale.RESIZE;
    public canvasWebWidth:number = 650;
    public canvasWebHeight:number = 450;

    public modeMobile:number = Phaser.Scale.RESIZE;
    public canvasMobileWidth:number = 650;
    public canvasMobileHeight:number = 450;

    get phaseGameBackgroundColor(): string {
        return this._phaseGameBackgroundColor;
    }

    set phaseGameBackgroundColor(value: string) {
        this._phaseGameBackgroundColor = value;
    }
    private _phaseGameBackgroundColor:string = '#79A6D9';

    //intro
    public introTitleColor:string = '#ffffff';
    public introListDefaultColor:string = '#ffffff';
    public introListPointerOverColor:string = '#0e8261';
    public introListPointerSelectedColor:string = '#0b2c7f';

    //question list item
    public questionListItemDefaultTextColor:string='#313d49';
    public questionListItemPointerOverTextColor:string='#527ead';
    public questionListItemSelectedTextColor:string='#00b0b6';
    public questionListItemRandomizeBrightenPercent:number = 0;
    public questionListItemBackgroundColors:Array<string> = new Array<string>(
        '#f8d9b6','#ffffff');

    //cell settings
    public cellBackgroudNonSelectedNotFilledColor: string = "#F6BE73";
    public cellBackgroudNonSelectedFilledColor: string = "#C8DEF6";

    public cellBackgroudSelectedNotFilledRandomizeBrightenPercent:number = 15;
    public cellBackgroudSelectedNotFilledColor: string = "#FFFFFF";
    public cellBackgroudSelectedFilledColor: string = "#FFFFFF";
    public cellBackgroudSelectedEditableNowColor: string = "#FFFFFF";

    public cellLetterTextNonSelectedColor: string = "#586e86";
    public cellLetterTextSelectedColor: string = "#586e86";
    public cellLetterTextEditableNowColor: string = "#A82525";
    public cellLetterTextValidColor: string = "#158717";


    public cellNumTextColor: string = "#68819D";

    public cellSelectedMarkColor: string = "#A82525";
    //end cells settings
}

export class IntroDatesListTheme {

}