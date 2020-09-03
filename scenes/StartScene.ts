import {BaseListItemView, ListView, ListViewDirection, ListViewItemsAlign} from "../ViewModel/ListView";
import {ApplicationTheme} from "../theme/ApplicationTheme";
import {ViewHelper} from "../ViewModel/ViewHelper";
import {CrosswordFeedEntry} from "../../data/CrosswordFeedEntry";
import {DailyCrosswordResourceProvider} from "../../data/DailyCrosswordResourceProvider";
import {ICrosswordData} from "../../data/ICrosswordData";
import Color = Phaser.Display.Color;
import BitmapText = Phaser.GameObjects.BitmapText;
import Rectangle = Phaser.Geom.Rectangle;
import Sprite = Phaser.GameObjects.Sprite;
import GroupCreateConfig = Phaser.Types.GameObjects.Group.GroupCreateConfig;
import Group = Phaser.GameObjects.Group;

enum Texts {
    Title = 'Ежедневные кроссворды',
    Message = 'Добро пожаловать!'
}


export class StartScene extends Phaser.Scene {
    private _datesList: ListView;
    constructor() {
        super('Start');
    }

    private _title:BitmapText;
    private _message:BitmapText;
    private _theme:ApplicationTheme;

    public preload(): void {
        const straightAssetsFolderBaseUrl:string = `${this.game.registry.get('baseUrl')}assets/straight/`;
        const scalableAssetsFolderBaseUrl:string = `${this.game.registry.get('baseUrl')}assets/scale${ViewHelper.devicePixelRatio}/`;
        this.load.image("pixel1x1", `${straightAssetsFolderBaseUrl}pixel1x1.jpg`);
        this.load.image("pixel1x1T", `${straightAssetsFolderBaseUrl}pixel1x1T.png`);
        this.load.image("backspace", `${scalableAssetsFolderBaseUrl}backspace.png`);
        this.load.image("right-arrow", `${scalableAssetsFolderBaseUrl}right-arrow.png`);
        this.load.image("reload", `${scalableAssetsFolderBaseUrl}reload.png`);
        this.load.image("menu", `${scalableAssetsFolderBaseUrl}menu.png`);
        this.load.image("tab", `${scalableAssetsFolderBaseUrl}tab.png`);
        this.load.image("open", `${scalableAssetsFolderBaseUrl}open.png`);


        this.load.bitmapFont("crossword_font",
            `${scalableAssetsFolderBaseUrl}fonts/big_semibold/crossword_font_semibold.png`,
            `${scalableAssetsFolderBaseUrl}fonts/big_semibold/crossword_font_semibold.fnt`);
        this.load.bitmapFont("font_semibold_14",
            `${scalableAssetsFolderBaseUrl}fonts/semibold14/crossword_font_semibold.png`,
            `${scalableAssetsFolderBaseUrl}fonts/semibold14/crossword_font_semibold.fnt`);
        this.load.bitmapFont("crossword_font_small",
            `${scalableAssetsFolderBaseUrl}fonts/small/crossword_font_regular.png`,
            `${scalableAssetsFolderBaseUrl}fonts/small/crossword_font_regular.fnt`);
        this.load.on(Phaser.Loader.Events.FILE_COMPLETE, this.onPixelDataLoaded, this);
        this.load.on(Phaser.Loader.Events.COMPLETE, this.onCompleteLoading, this);
    }

    private onPixelDataLoaded(key: string, file):void {
        // console.log(`onPixelDataLoaded key: ${key}`);
        if(key!="pixel1x1")
        {
            return;
        }
        this.load.off(Phaser.Loader.Events.FILE_COMPLETE, this.onPixelDataLoaded, this);

        this.createPreloader();
    }

    private onCompleteLoading(loader:any, totalComplete:number, totalFailed:number) {
        // console.log(`onCompleteLoading totalComplete: ${totalComplete} totalFailed: ${totalFailed} `);
        this.load.off(Phaser.Loader.Events.FILE_COMPLETE, this.onPixelDataLoaded, this);
        this.load.off(Phaser.Loader.Events.COMPLETE, this.onCompleteLoading, this);
        this.removePreloader();
    }

    public create(): void {
        this._theme = (this.game.registry.get('theme') as ApplicationTheme);

        this._message = this.add.bitmapText(
            0,
            0,
            "crossword_font",
            Texts.Message,
            14/ViewHelper.devicePixelRatio)
            .setTintFill(Color.HexStringToColor(this._theme.introTitleColor).color)
            .setCenterAlign()
            .setOrigin(0.5);

        this._title = this.add.bitmapText(
            0,
            0,
            "crossword_font",
            Texts.Title,
            30/ViewHelper.devicePixelRatio)
            .setTintFill(Color.HexStringToColor(this._theme.introTitleColor).color)
            .setCenterAlign()
            .setOrigin(0.5);


        this.createDatesList();

        this.calculateSizeDependsParams(this.game.canvas.width, this.game.canvas.height);
        this.game.scale.on('resize', this.onResize, this);

    }

    private onResize (gameSize):void {
        let width = gameSize.width;
        let height = gameSize.height;
        console.log(`width: ${width} height: ${height} 
            camera scale: ${this.cameras.main.scaleManager.displayScale.x} ${this.cameras.main.scaleManager.displayScale.y}
            camera size: ${this.cameras.main.width} ${this.cameras.main.height}
            camera display size: ${this.cameras.main.displayWidth} ${this.cameras.main.displayHeight}
            canvas size: ${this.game.canvas.width} ${this.game.canvas.height}
            game size: ${this.game.config.width} ${this.game.config.height}
            `);

        this.resize(width, height);
    }

    private resize(width: any, height: any) {
        this.calculateSizeDependsParams(width, height);
    }

    private calculateSizeDependsParams(width: number, height: number) {
        let centerX:number = Math.round(width*0.5);
        let contentMargin = Math.round(width*0.2);
        let lastY:number = 0;
        this._message
            .setX(centerX)
            .setY(Math.round(height*0.08))
            .setMaxWidth(width - contentMargin)

        lastY = this._message.y + this._message.getTextBounds(true).global.height;

        this._title
            .setX( centerX)
            .setY(Math.round(lastY + height*0.1))
            .setMaxWidth(width - contentMargin)

        lastY = this._title.y + this._title.getTextBounds(true).global.height;

        // let bottomMargin = height*0.2;
        let listWidth = 320; //todo check if need to make this like % from width

        let datesZone = new Rectangle(
            Math.round((width - listWidth)*0.5),
            Math.round(lastY + height*.1),
            Math.round(listWidth),
            Math.round((height - lastY)*3/4 ));
        this._datesList.setViewport(datesZone.x, datesZone.y, datesZone.width, datesZone.height);

    }

     private createDatesList() {

         let data: Array<{ crosswordEntry: CrosswordFeedEntry, progress: number }> =
             new Array<{ crosswordEntry: CrosswordFeedEntry, progress: number }>();
         let resourceProvider = this.game.registry.get('resourceProvider') as CrosswordResourceProvider;
         let availableDates = resourceProvider.getCrosswordsEntriesByDates(resourceProvider.serverDateUTC - resourceProvider.localServerDate.getTimezoneOffset() * 60 * 1000, 10);
         availableDates.forEach(entry => {
             data.push({
                 crosswordEntry: entry,
                 progress: Math.round(Math.random() * 100)// todo organize saving of progress
             });
         });

         this._datesList = new ListView(this);
         this._datesList.initialize(0, 0, 100, 100, data,
             (data: { crosswordEntry: CrosswordFeedEntry, progress: number }, index: number) => {
                 let itemView = new DatesListItemView(this);
                 itemView.data = data;
                 const dateNumber: number = parseInt(data.crosswordEntry.date);
                 let date: Date = new Date(dateNumber);
                 itemView.createView(date, data.progress, this._theme);
                 return itemView;
             },
             ListViewDirection.vertical,
             ListViewItemsAlign.begin);
         this._datesList.once('select', this.onDateSelected.bind(this));
     }

    private async onDateSelected(data: { crosswordEntry: CrosswordFeedEntry, progress: number }) {
        console.log(`onDateSelected date: ${data.crosswordEntry.date}`);

        const crosswordData = await this.loadCrosswordData(data.crosswordEntry);
        console.log(`Crossword loaded. Desc: ${crosswordData.desc}`);

        this.scene.start('Game', crosswordData);
        this.game.scale.off('resize', this.onResize, this);
    }

    private async loadCrosswordData(entry:CrosswordFeedEntry): Promise<ICrosswordData> {
        let resourceProvider = this.game.registry.get('resourceProvider') as DailyCrosswordResourceProvider
        return  await resourceProvider.loadCrosswordData(entry);
    }

    private _preloader:Group|null;

    private createPreloader ()
    {
        this._preloader = this.add.group( <GroupCreateConfig>{
            key: 'pixel1x1',
            // repeat: 5,
            quantity:5,
            setScale: { x: 5, y:5 },
        })
        .setOrigin(0.5);
        Phaser.Actions.GridAlign(this._preloader.getChildren(), {
            width: 5,
            height: 1,
            cellWidth: 45,
            cellHeight: 45,
            x: this.game.canvas.width*0.5,
            y: this.game.canvas.height*0.5
        });

        this._preloader.children.iterate( (entry, index) =>  {

            this.tweens.add({
                targets: entry,
                scaleX: 30,
                scaleY: 30,
                ease: 'Sine.easeInOut',
                duration: 300,
                delay: index * 50,
                repeat: -1,
                yoyo: true
            });
        }, this);
    }

    private removePreloader():void{
        if(!this._preloader)
        {
            return;
        }
        this.tweens.killTweensOf(this._preloader.getChildren());
        // this._preloader.active = false;
        this._preloader.destroy(true);
        this._preloader = null;
    }
}

