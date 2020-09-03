export class ViewHelper {


    static registry: Phaser.Data.DataManager;
    public static  isHorizontalLayout(width:number, height:number):boolean
    {
      return  width > 450;
    }

    public static get devicePixelRatio():number {
        if (!this.registry.has('devicePixelRatio')) {
            if (window.devicePixelRatio >= 3) {
                this.registry.set('devicePixelRatio', 3);
            } else if (window.devicePixelRatio >= 2) {
                this.registry.set('devicePixelRatio', 2);
            } else {
                this.registry.set('devicePixelRatio', 1);
            }
        }

        return this.registry.get('devicePixelRatio');
    }


    static calculateBitmapFontSize(text: Phaser.GameObjects.BitmapText, heightToFit: number) {

        let initialLineHeight = text.fontData.lineHeight;
        let initialFontSize = text.fontData.size;
        // console.log(`calculateBitmapFontSize font: ${text.fontData.font} size: ${text.fontData.size} lineHeight: ${text.fontData.lineHeight}`);
        return  Math.floor(heightToFit* initialFontSize/initialLineHeight);
    }
}