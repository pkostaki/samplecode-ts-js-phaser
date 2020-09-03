import Group = Phaser.GameObjects.Group;

export  class GameObjPool {
    public static Pool:Group;
    public static diagnostic(){
        console.log(`Pool length: ${GameObjPool.Pool.getLength()} countActive: ${GameObjPool.Pool.countActive(true)}`)
    }
}