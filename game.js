import kaboom from "https://unpkg.com/kaboom@next/dist/kaboom.mjs";

kaboom({
  global: true,
  background: [ 0, 0, 0, ],
});

loadSprite("bbishop", "sprites/bbishop.png");
loadSprite("bking", "sprites/bking.png");
loadSprite("bknight", "sprites/bknight.png");
loadSprite("bpawn", "sprites/bpawn.png");
loadSprite("bqueen", "sprites/bqueen.png");
loadSprite("brook", "sprites/brook.png");
loadSprite("wbishop", "sprites/wbishop.png");
loadSprite("wking", "sprites/wking.png");
loadSprite("wknight", "sprites/wknight.png");
loadSprite("wpawn", "sprites/wpawn.png");
loadSprite("wqueen", "sprites/wqueen.png");
loadSprite("wrook", "sprites/wrook.png");
loadSprite("empty", "sprites/empty.png");
loadSprite("border", "sprites/border.png");

loadSound("piece_capture", "sounds/piece_capture.mp3");
loadSound("piece_move", "sounds/piece_move.mp3");

scene("main", (args = {}) => {
  layers(["board", "boarder", "peice", "ui"]);

  const size = 60;
  const OFFSETX = ((width()/2) - 240);
  const OFFSETY = ((height()/2) - 240);
  const peicePosOffset = 30;
  const w = 90;
  const b = 200;
  const colorBlack = color(135,175,85);
  const colorWhite = color(255,255,205);
  const initFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  let curDraggin = null;
  let curHover = null;
  let selected = null;

  let board = [
    [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
    [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
    [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
    [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
    [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
    [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
    [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
    [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
  ]
  let pieceSpriteMap = {
    "k":"bking",
    "p":"bpawn",
    "n":"bknight",
    "b":"bbishop",
    "r":"brook",
    "q":"bqueen",
    "K":"wking",
    "P":"wpawn",
    "N":"wknight",
    "B":"wbishop",
    "R":"wrook",
    "Q":"wqueen",
  }
  let fileLetterMap = {
    0:"8",
    1:"7",
    2:"6",
    3:"5",
    4:"4",
    5:"3",
    6:"2",
    7:"1",
  }
  let rankLetterMap = {
    0:"a",
    1:"b",
    2:"c",
    3:"d",
    4:"e",
    5:"f",
    6:"g",
    7:"h",
  }
  let hoverHight = add([
    sprite("border"),
    pos(OFFSETX, OFFSETY),
    layer("boarder"),
  ]);

  class Piece {
    constructor (pos,piece,color) {  
      this.pos = pos
      this.piece = piece
      this.color = color
    }
  }

  function isNumeric(str) {
    if (typeof str != "string") return false
    return !isNaN(str) && !isNaN(parseFloat(str))
  }

  function loadFEN(fen) {
    let fenArr = []
    let fileIndex = 0
    let rankIndex = 0
    let piecePos = []

    fenArr = fen.split(" ") //TODO: implement rest of FEN
    console.log("fenArr[0]: ", fenArr[0])

    piecePos = fenArr[0].split("")
    for (let i = 0; i < piecePos.length; i++) {
      let cur = piecePos[i]
      let temp = 0
      if (isNumeric(cur)) {
        for (let j = 0; j < cur; j++) {
          board[fileIndex][rankIndex].id = rankLetterMap[rankIndex]+fileLetterMap[fileIndex]
          rankIndex++
        }
      } else if (cur === "/") {
        fileIndex++
        rankIndex = 0
      } else {
        board[fileIndex][rankIndex].id = rankLetterMap[rankIndex]+fileLetterMap[fileIndex]
        board[fileIndex][rankIndex].piece = pieceSpriteMap[cur]
        rankIndex++
      }
    }
  }
  loadFEN(initFEN);

  // custom component for handling drag & drop behavior
  function drag() {

    // the difference between object pos and mouse pos
    let offset = vec2(0);

    return {
      id: "drag",
      require: [ "pos", "area", ],
      add() {
        this.clicks(() => {
          if (curDraggin) {
            return;
          }
          curDraggin = this;
          offset = mousePos().sub(this.pos);
          this.z = z(999)
        });
      },
      update() {
        if (curDraggin === this) {
          this.pos = mousePos().sub(offset);
        }
      },
    };

  }
  // drop
  mouseRelease(() => { 
    curDraggin = null;
  });

  for(let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      let x = (size*j) + OFFSETX
      let y = (size*i) + OFFSETY

      //labeling
      if (j === 0) {
        add ([
          text(fileLetterMap[i], {size: 30}),
          pos(x - 25,y + 20)
        ]);
      }
      if (i === 7) {
        add ([
          text(rankLetterMap[j], {size: 30}),
          pos(x + 20,y + 60)
        ]);
      }
      
      const tile = add([
        rect(size, size),
        pos(x, y),
        area({}),
        layer("board"),
        (j+i)%2 === 0 ? colorWhite : colorBlack,
        "tile"
      ]);

      board[i][j].tile = tile;
      tile._id = board[i][j].id

      x += peicePosOffset
      y += peicePosOffset

      board[i][j].pos = pos(x,y);

      if (board[i][j].piece !== null) {
        const p = add([
          sprite(board[i][j].piece),
          pos(x, y),
          area({}),
          scale(1),
          origin("center"),
          //drag(),
          layer("peice"),
          "peice",
          board[i][j].piece,
          color(255,255,255)
        ]);

        board[i][j].piece = p
      }
    }
  }
  //action(() => cursor("default"));

  hovers("tile", (t) => {
    if (selected === null) {
      hoverHight.pos = t.pos
      readd(hoverHight)
      curHover = t
    }
  },() => {
    //on exit hover
  })

  hovers("peice", (p) => {
    /*if (curDraggin === null) {
      cursor("grab");
    } else if (curDraggin === p) {
      cursor("grabbing");
    }*/
  }, () => {
    //on exit hover
  });

  clicks("peice", (p) => {
    console.log(p.color);
    if (selected === null) {
      selected = p;
      debug.log("selected: " + p._id);
    } else if (selected === p) {
      selected = null;
      debug.log("un-selected: " + p._id);
    }
  });

  //debug
  console.log(board[0][0].piece);
});
go("main");