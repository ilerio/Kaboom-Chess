import kaboom from "https://unpkg.com/kaboom@next/dist/kaboom.mjs";
import {temp} from "./defs.js" // TODO: put all function definitions in here

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
loadSprite("highlight", "sprites/highlight.png");
loadSprite("border", "sprites/border.png");
loadSprite("move", "sprites/move.png");

loadSound("piece_capture", "sounds/piece_capture.mp3");
loadSound("piece_move", "sounds/piece_move.mp3");

scene("main", (args = {}) => {
  layers(["board", "boarder", "peice", "ui"]);

  const size = 60;
  const offsetX = ((width()/2) - 240);
  const offsetY = ((height()/2) - 240);
  const peicePosOffset = 30;
  const colorBlack = color(135,175,85);
  const colorWhite = color(255,255,205);
  const initFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  let curHover = null;
  let selected = null;
  let curTurn = "white"

  let fiftyMoveRule = 0

  let canCastle = {
    whiteQeenSide: true,
    whiteKingSide: true,
    blackQeenSide: true,
    blackKingSide: true,
  }

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
  let fileLetterUnMap = {
    "8":0,
    "7":1,
    "6":2,
    "5":3,
    "4":4,
    "3":5,
    "2":6,
    "1":7,
  }
  let rankLetterUnMap = {
    "a":0,
    "b":1,
    "c":2,
    "d":3,
    "e":4,
    "f":5,
    "g":6,
    "h":7,
  }
  let hoverHight = add([
    sprite("border"),
    pos(offsetX, offsetY),
    layer("boarder"),
  ]);
  hoverHight.hidden = true

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
          board[fileIndex][rankIndex].id = rankLetterMap[rankIndex]+fileLetterMap[fileIndex];
          board[fileIndex][rankIndex].piece = null;
          rankIndex++;
        }
      } else if (cur === "/") {
        fileIndex++;
        rankIndex = 0;
      } else {
        board[fileIndex][rankIndex].id = rankLetterMap[rankIndex]+fileLetterMap[fileIndex];
        board[fileIndex][rankIndex].piece = pieceSpriteMap[cur];
        rankIndex++;
      }
    }
  }

  function drawBoard() {
    for(let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        // TODO: use indexToWorldPos()
        let x = (size*j) + offsetX
        let y = (size*i) + offsetY

        //labeling
        if (j === 0) {
          add ([
            text(fileLetterMap[i], {size: 30}),
            pos(x - 25,y + 20)
          ]);

          //////////DEBUG TODO: DELETE
          add ([
            text(i.toString(), {size: 30}),
            pos(x - 50,y + 20),
            color(255, 0, 0)
          ]);
          //////////DEBUG TODO: DELETE
        }
        if (i === 7) {
          add ([
            text(rankLetterMap[j], {size: 30}),
            pos(x + 20,y + 60)
          ]);
          //////////DEBUG TODO: DELETE
          add ([
            text(j.toString(), {size: 30}),
            pos(x + 20,y + 90),
            color(255, 0, 0)
          ]);
          //////////DEBUG TODO: DELETE
        }
        
        const tile = add([
          rect(size, size),
          pos(x, y),
          area({}),
          layer("board"),
          (j+i)%2 === 0 ? colorWhite : colorBlack,
          "tile"
        ]);

        tile._id = board[i][j].id
        board[i][j].tile = tile;
      }
    }
  }

  function drawPeices() {
    for(let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {    

        let pos = indexToWorldPos(j,i,false)
        board[i][j].pos = pos;

        if (board[i][j].piece !== null) {
          const p = add([
            sprite(board[i][j].piece),
            pos,
            area({}),
            scale(1),
            origin("center"),
            layer("peice"),
            "peice",
            board[i][j].piece,
            board[i][j].piece[0] === "w" ? "white" : "black",
          ]);

          board[i][j].piece = p
        }
      }
    }
  }

  function objectAtid(id) {
    let x = rankLetterUnMap[id[0]];
    let y = fileLetterUnMap[id[1]];
    return board[y][x];
  }

  function generateMoveList(piece, startPos) {
    /*
      let move = {}
      
      //all:
      move.end = pos
      move.capture = ture
      
      //pawns:
      move.enpas = true
      move.promote = true
      move.start = pos

      //king:
      move.castling = true
    */

    let moveList = []

    switch (piece) {
      case "wpawn", "bpawn": 
        moveList = pawnMoveList(startPos, piece[0]);
        break;
      case "wrook", "brook": 

        break;
      case "wknight", "bknight":

        break;
      case "wbishop", "bbishop": 
        
        break;
      case "wqueen", "bqueen":
        
        break;
      case "wking", "bking":
        
        break;
    }

    return moveList;
  }

  function pawnMoveList(startPos, color) {
    /*
      moving as a pawn:
      w: a2 -> a3 or a4 (on first move)
      b: a7 -> a6 or a5

      enpas capturs can only happen on rank 6 and 3

      capture as a pawn:
      w:b7xc6 | b7xa6
      b:b7xc3 | b2xa3
    */

    let x = startPos.x;
    let y = startPos.y;
    if (color === "w") {
      //
    }
  }

  function indexToWorldPos(destX, destY, tile) {
    let x = 0;
    let y = 0;

    if (tile) {
      x = (size*destX) + offsetX;
      y = (size*destY) + offsetY;
    } else {
      x = (size*destX) + offsetX + peicePosOffset;
      y = (size*destY) + offsetY + peicePosOffset;
    }
    return pos(x,y);
  }

  function worldPosToIndex(pos, tile) {
    let x = 0;
    let y = 0;

    if (tile) {
      x = (pos.x - (offsetX)) / size
      y = (pos.y - (offsetY)) / size
    } else {
      x = (pos.x - (offsetX + peicePosOffset)) / size
      y = (pos.y - (offsetY + peicePosOffset)) / size
    }

    return {"x": x, "y": y}
  }

  function tilePosToPeicePos(pos) {
    let x = worldPosToIndex(pos.x, true).x
    let y = worldPosToIndex(pos.y, true).y

    return indexToWorldPos(x,y,false)
  }

  clicks("tile", (t) => {
    /*let x = worldPosToIndex(t.pos, true).x
    let y = worldPosToIndex(t.pos, true).y
    add([
      sprite("move"),
      indexToWorldPos(x,y),
      layer("ui"),
      origin("center"),
      "move",
    ]);*/
  });

  function init() {
    loadFEN(initFEN);
    drawBoard();
    drawPeices();
  }

  hovers("tile", (t) => {
    if (curHover != t) {
      hoverHight.pos = t.pos;
      readd(hoverHight);
      let hoverPeice = objectAtid(t._id).piece;
      if (hoverPeice != null) {
        hoverHight.hidden = false;
      } else {
        hoverHight.hidden = true;
      }
    }
    curHover = t;
  });

  clicks("peice", (p) => {
    if (selected === null && p.is(curTurn)) {
      selected = p;
      add([
        sprite("highlight"),
        pos(p.pos.x,p.pos.y),
        layer("ui"),
        origin("center"),
        "highlight",
      ]);
    } else if (selected === p) {
      selected = null;
      destroyAll("highlight");
      destroyAll("move");
    }
  });

  init();

  //debug
  console.log(board[0][0].tile);
  temp();
});
go("main");