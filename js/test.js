
  // Using @property tag
  /** 
   * @typedef {Object} User
   * @property {string} name The user's full name.
   * @property {number} [age] The user's age.
   */


  //---------

    /**
    * @typedef  {Object}    Growth
    * @property {number}    initial               - Name of crop.
    * @property {number}    regrow                - URL to Official wiki.
    * 
   */

  /**
    * @typedef  {Object}    Seed
    * @property {number}    sell               - Name of crop.
    * @property {number}    pierre                - URL to Official wiki.
    * @property {number}    special                - Path to Image File.
    * @property {string}    location                - Path to Image File.
    * @property {string}    url                - Path to Image File.
    * 
   */

    /**
    * @typedef  {Object}    Crop
    * @property {string}    name               - Name of crop.
    * @property {string}    url                - URL to Official wiki.
    * @property {string}    img                - Path to Image File.
    * @property {Seed}      Seed  
    * @property {Growth}    Growth  
    */

/**
 * @type Crop
 */
class Crop {
    /** @constructs */
    constructor(name,url,img,Seed,Growth){
        this.name   = name;
        this.url    = url;
        this.img    = img;
        this.Seed   = Seed;
        this.Growth   = Growth;
    }
}

/**
 * @type Seed
 */
class Seed extends Crop {
    /** @constructs */
    constructor(sell,pierre,joja,special,location,url){
        this.sell = sell;
        this.pierre = pierre;
        this.joja = joja;
        this.special = special;
        this.location = location;
        this.url = url;
    }
}

class Growth extends Crop {
    constructor(initial,regrow){
        this.initial    = initial;
        this.regrow     = regrow;
    }
}

class Produce {
    constructor(){

    }
}

class Profit {
    constructor(){

    }
}


