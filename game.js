import kaboom from "https://unpkg.com/kaboom@next/dist/kaboom.mjs";
import {dlog, clog} from "./defs.js" // TODO: put all function definitions in here

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
    //console.log("fenArr[0]: ", fenArr[0])

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

  function getPeiceName(p) {
    let name = "";
    if (p.is("bking")) {
      name = "bking";
    } else if (p.is("bpawn")) {
      name = "bpawn";
    } else if (p.is("bknight")) {
      name = "bknight";
    } else if (p.is("bbishop")) {
      name = "bbishop";
    } else if (p.is("brook")) {
      name = "brook";
    } else if (p.is("bqueen")) {
      name = "bqueen";
    } else if (p.is("wking")) {
      name = "wking";
    } else if (p.is("wpawn")) {
      name = "wpawn";
    } else if (p.is("wknight")) {
      name = "wknight";
    } else if (p.is("wbishop")) {
      name = "wbishop";
    } else if (p.is("wrook")) {
      name = "wrook";
    } else if (p.is("wqueen")) {
      name = "wqueen";
    } else {
      name = "ERROR";
    }
    return name;
  }

  function generateMoveList(p) {
    /*
      move {
        pos: pos(x,y),
        capture: false,
      }
      
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
    let pieceName = getPeiceName(p);

    switch (pieceName) {
      case "wpawn": case "bpawn": 
        moveList = pawnMoveList(p.pos, pieceName[0]);
        break;
      case "wrook": case "brook": 

        break;
      case "wknight": case "bknight":

        break;
      case "wbishop": case "bbishop": 
        
        break;
      case "wqueen": case "bqueen":
        
        break;
      case "wking": case "bking":
        
        break;
    }

    drawMoves(moveList);
  }

  function drawMoves(moves) {
    for (let i = 0; i < moves.length; i++) {
      let dest = moves[i].pos;
      add([
        sprite("move"),
        dest,
        area({}),
        layer("ui"),
        origin("center"),
        "move",
      ]);
    }
  }

  function pawnMoveList(startPos, color) {
    /*
      move {
        pos: pos(x,y),
        capture: false,
        enpas: false,
        promote: false,
      }

      moving as a pawn:
      w: a2 -> a3 or a4 (on first move) // down in the y direction
      b: a7 -> a6 or a5 // up in the y direction

      enpas capturs can only happen on rank 6 and 3

      capture as a pawn:
      w:b7xc6 | b7xa6
      b:b7xc3 | b2xa3
    */
    let moveList = []
    let x = worldPosToIndex(startPos, false).x;
    let y = worldPosToIndex(startPos, false).y;

    if (color === "w") {
      if (board[y-1][x].piece === null) {
        moveList.push({
          "pos": indexToWorldPos(x, (y-1), false),
          "capture": false,
        });
        if (y === 6) { // start move
          if (board[y-2][x].piece === null) {
            moveList.push({
              "pos": indexToWorldPos(x, (y-2), false),
              "capture": false,
            });
          }
        }
      }
    } 

    if (color === "b") {
      if (board[y+1][x].piece === null) {
        moveList.push({
          "pos": indexToWorldPos(x, (y+1), false),
          "capture": false,
        });
        if (y === 1) { // start move
          if (board[y+2][x].piece === null) {
            moveList.push({
              "pos": indexToWorldPos(x, (y+2), false),
              "capture": false,
            });
          }
        }
      }
    }
    return moveList;
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

    return {"x": x, "y": y};
  }

  function tilePosToPeicePos(pos) {
    let x = worldPosToIndex(pos.x, true).x
    let y = worldPosToIndex(pos.y, true).y

    return indexToWorldPos(x,y,false)
  }

  function movePeice(p, dest) {
    // handle captures
    let startXIndex = worldPosToIndex(p.pos, false).x;
    let startYIndex = worldPosToIndex(p.pos, false).y;
    let destXIndex = worldPosToIndex(dest, false).x;
    let destYIndex = worldPosToIndex(dest, false).y;
    let name = getPeiceName(p)

    p.pos = dest
    board[destYIndex][destXIndex].piece = p;
    board[startYIndex][startXIndex].piece = null;

    if (name[0] === "w") {
      curTurn = "black"
    } else {
      curTurn = "white"
    }
  }

  function init() {
    loadFEN(initFEN);
    drawBoard();
    drawPeices();
  }

  clicks("move", (m) => {
    if (selected != null) {
      movePeice(selected, m.pos);
    }
  });

  /*clicks("tile", (t) => {
    dlog("tile " + t._id + ": pos.x = " +t.pos.x); 
    dlog("tile " + t._id + ": pos.t = " +t.pos.y);
  });*/

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
        layer("board"),
        origin("center"),
        "highlight",
      ]);
      generateMoveList(p);
    } else if (selected === p) {
      selected = null;
      destroyAll("highlight");
      destroyAll("move");
    }
  });

  init();

  //debug
  //console.dlog(board[0][0].tile);
});
go("main");