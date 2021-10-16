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
loadSprite("attack", "sprites/attack.png");

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

  const maxIndex = 7;
  const minIndex = 0;

  const initFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  let curHover = null;
  let selected = null;
  let curTurn = "white";
  let promoteHighlight = null;
  let promotePeice = "queen";
  /*
    {
      peice: p,
      enpasPos: pos,
    }
  */
  let enPasant = null;

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
    let fenArr = [];
    let fileIndex = 0;
    let rankIndex = 0;
    let piecePos = [];

    fenArr = fen.split(" "); //TODO: implement rest of FEN
    //console.log("fenArr[0]: ", fenArr[0])

    piecePos = fenArr[0].split("")
    for (let i = 0; i < piecePos.length; i++) {
      let cur = piecePos[i];
      let temp = 0;
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
        let x = (size*j) + offsetX;
        let y = (size*i) + offsetY;

        //labeling
        if (j === 0) {
          add ([
            text(fileLetterMap[i], {size: 30}),
            pos(x - 25,y + 20),
          ]);

          //////////DEBUG TODO: DELETE
          add ([
            text(i.toString(), {size: 30}),
            pos(x - 50,y + 20),
            color(255, 0, 0),
          ]);
          //////////DEBUG TODO: DELETE
        }
        if (i === 7) {
          add ([
            text(rankLetterMap[j], {size: 30}),
            pos(x + 20,y + 60),
          ]);
          //////////DEBUG TODO: DELETE
          add ([
            text(j.toString(), {size: 30}),
            pos(x + 20,y + 90),
            color(255, 0, 0),
          ]);
          //////////DEBUG TODO: DELETE
        }
        
        const tile = add([
          rect(size, size),
          pos(x, y),
          area(),
          layer("board"),
          (j+i)%2 === 0 ? colorWhite : colorBlack,
          "tile",
        ]);

        tile._id = board[i][j].id;
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
          const p = drawPeice(indexToWorldPos(j,i,false), board[i][j].piece);
          board[i][j].piece = p;
        }
      }
    }
  }

  function drawPeice(pos, pieceName) {
    const p = add([
      sprite(pieceName),
      pos,
      area(),
      scale(1),
      origin("center"),
      layer("peice"),
      "peice",
      pieceName,
      pieceName[0] === "w" ? "white" : "black",
    ]);
    return p;
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
    */

    let moveList = [];
    let pieceName = getPeiceName(p);

    switch (pieceName) {
      case "wpawn": case "bpawn": 
        moveList = pawnMoveList(p.pos, pieceName[0]);
        break;
      case "wrook": case "brook": 

        break;
      case "wknight": case "bknight":
        moveList = knightMoveList(p.pos, pieceName[0]);
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
    let spriteName = "";
    for (let i = 0; i < moves.length; i++) {
      let dest = moves[i].pos;
      if (moves[i].capture) {
        spriteName = "attack";
      } else {
        spriteName = "move";
      }
      add([
        sprite(spriteName),
        dest,
        area(),
        layer("ui"),
        origin("center"),
        "move",
      ]);
    }
  }

  function pawnMoveList(startPos, color) {
    /*
      pawn:
      w: a2 -> a3 or a4 (on first move) // down in the y direction
      b: a7 -> a6 or a5 // up in the y direction

      enpas capturs can only happen on rank 6 and 3

      capture as a pawn:
      w:b7xc6 | b7xa6
      b:b7xc3 | b2xa3
    */
    let moveList = [];
    let x = worldPosToIndex(startPos, false).x;
    let y = worldPosToIndex(startPos, false).y;
    let m = null;
    let dir = 1;
    let promote = false;

    if (color === "w") {
      dir *= -1;
    }

    if ((y+(1*dir)) >= minIndex && (y+(1*dir)) <= maxIndex) { 

      // regular move
      if (board[y+(1*dir)][x].piece === null) {
        m = indexToWorldPos(x, (y+(1*dir)), false);
        moveList.push({
          "pos": m,
          "capture": false,
        });
      }

      // capture
      if (x+1 >= minIndex && x+1 <= maxIndex) {
        m = indexToWorldPos(x+1, (y+(1*dir)), false);
        if (isMoveCapture(m, color)) {
          moveList.push({
            "pos": m,
            "capture": true,
          });
        }
      }
      if (x-1 >= minIndex && x-1 <= maxIndex) {
        m = indexToWorldPos(x-1, (y+(1*dir)), false);
        if (isMoveCapture(m, color)) {
          moveList.push({
            "pos": m,
            "capture": true,
          });
        }
      }
    }

    // first move
    if ((y === 6 && color === "w") || (y === 1 && color === "b")) {
      if (board[y+(2*dir)][x].piece === null) {
        m = indexToWorldPos(x, (y+(2*dir)), false);
        moveList.push({
          "pos": m,
          "capture": false,
        });
      }
    }

    return moveList;
  }

  function knightMoveList(startPos, color) {
    /*
      moving as a knight:
      all knight moves:
      y-2, x-1
      y-2, x+1
      y+2, x-1
      y+2, x+1
      y-1, x-2
      y+1, x-2
      y-1, x+2
      y-2, x+2
    */

    let moveList = [];
    let x = worldPosToIndex(startPos, false).x;
    let y = worldPosToIndex(startPos, false).y;

    let y2 = 0;
    let x2 = 0;
    let y1 = 0;
    let x1 = 0;

    let one = 1;
    let two = 2;

    let m = null;

    for (let i = 1; i <= 2; i++) {
      two *= -1;
      for (let j = 1; j <= 2; j++) {
        one *= -1;
        y2 = y+two;
        x2 = x+two;
        y1 = y+one;
        x1 = x+one;
        if (y2 >= minIndex && y2 <= maxIndex && x1 >= minIndex && x1 <= maxIndex) {
          m = indexToWorldPos(x1, y2, false);
          if (!moveToPosHasFriendly(m, color)) {
            moveList.push({
              "pos": m,
              "capture": isMoveCapture(m, color),
            });
          }
        }
        if (x2 >= minIndex && x2 <= maxIndex && y1 >= minIndex && y1 <= maxIndex) {
          m = indexToWorldPos(x2, y1, false);
          if (!moveToPosHasFriendly(m, color)) {
            moveList.push({
              "pos": m,
              "capture": isMoveCapture(m, color),
            });
          }
        }
      }
    }

    return moveList;
  }

  function queenMoveList(startPos, color) {}

  function kingMoveList(startPos, color) {}

  function bishopMoveList(startPos, color) {}

  function rookMoveList(startPos, color) {}

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
      x = (pos.x - (offsetX)) / size;
      y = (pos.y - (offsetY)) / size;
    } else {
      x = (pos.x - (offsetX + peicePosOffset)) / size;
      y = (pos.y - (offsetY + peicePosOffset)) / size;
    }

    return {"x": x, "y": y};
  }

  function tilePosToPeicePos(pos) {
    let x = worldPosToIndex(pos, true).x;
    let y = worldPosToIndex(pos, true).y;
    return indexToWorldPos(x,y,false).pos;
  }

  function movePeice(p, dest) {
    // handle captures
    let startXIndex = worldPosToIndex(p.pos, false).x;
    let startYIndex = worldPosToIndex(p.pos, false).y;
    let destXIndex = worldPosToIndex(dest, false).x;
    let destYIndex = worldPosToIndex(dest, false).y;
    let peiceName = getPeiceName(p);

    let promoted = null

    //capture
    let destPeice = board[destYIndex][destXIndex].piece;
    if (destPeice != null) {
      destroy(destPeice);
    }

    //promote pawn | TODO: enPasant
    if ((p.is("wpawn") || p.is("bpawn"))) {
      if (destYIndex === 7 || destYIndex === 0) {
        let temp = p;
        selected = null;
        destroyAll("highlight");
        destroyAll("move");
        p = drawPeice(indexToWorldPos(destXIndex,destYIndex), peiceName[0]+promotePeice);
        destroy(temp);
      }
    }

    p.pos = dest;

    board[destYIndex][destXIndex].piece = p;
    board[startYIndex][startXIndex].piece = null;

    // advance turn
    if (peiceName[0] === "w") {
      curTurn = "black";
    } else {
      curTurn = "white";
    }

    // TODO: 50 move rule 
  }

  function isMoveCapture(move, color) {
    let pos = move.pos;
    let x = worldPosToIndex(pos, false).x;
    let y = worldPosToIndex(pos, false).y;
    let p = board[y][x].piece;

    if (p === null) return false;

    let name = getPeiceName(p);

    if (name[0] === color) {
      return false;
    }

    return true;
  }

  function moveToPosHasFriendly(move, color) {
    let pos = move.pos;
    let x = worldPosToIndex(pos, false).x;
    let y = worldPosToIndex(pos, false).y;
    let p = board[y][x].piece;

    if (p === null) return false;

    let name = getPeiceName(p);

    if (name[0] === color) {
      return true;
    }

    return false;
  }

  function drawPromote() {
    add ([
      text("promote", {size: 20}),
      indexToWorldPos(9,0,true),
      layer("ui"),
      origin("bot"),
    ]);
    add([
      rect(size, (size*4)),
      indexToWorldPos(9,0,true),
      outline(1),
      layer("board"),
      origin("top"),
      area(),
      "promote",
    ]);
    promoteHighlight = add([
      sprite("highlight"),
      indexToWorldPos(9,0,true),
      layer("board"),
      origin("top"),
      "promote",
      "promote-border",
    ]);
    add([
      sprite("wqueen"),
      indexToWorldPos(9,0,true),
      area(),
      scale(1),
      origin("top"),
      layer("peice"),
      "promote",
      "promote-peice",
      "promote-queen",
    ]);
    add([
      sprite("wknight"),
      indexToWorldPos(9,1,true),
      area(),
      scale(1),
      origin("top"),
      layer("peice"),
      "promote",
      "promote-peice",
      "promote-knight",
    ]);
    add([
      sprite("wrook"),
      indexToWorldPos(9,2,true),
      area(),
      scale(1),
      origin("top"),
      layer("peice"),
      "promote",
      "promote-peice",
      "promote-rook",
    ]);
    add([
      sprite("wbishop"),
      indexToWorldPos(9,3,true),
      area(),
      scale(1),
      origin("top"),
      layer("peice"),
      "promote",
      "promote-peice",
      "promote-bishop",
    ]);
  }

  function init() {
    loadFEN("rnbqkbnr/PPPPpppp/8/p2pP2P/p2pP2P/8/PPPPpppp/RNBQKBNR w KQkq - 0 1");
    drawBoard();
    drawPeices();
    drawPromote();
  }

  clicks("move", (m) => {
    if (selected != null) {
      movePeice(selected, m.pos);
    }
  });

  clicks("attack", (m) => {
    if (selected != null) {
      movePeice(selected, m.pos);
    }
  });

  clicks("promote-peice", (pp) => {
    promoteHighlight.pos = pp.pos;

    if (pp.is("promote-queen")) {
      promotePeice = "queen";
    } else if (pp.is("promote-knight")) {
      promotePeice = "knight";
    } else if (pp.is("promote-rook")) {
      promotePeice = "rook";
    } else if (pp.is("promote-bishop")) {
      promotePeice = "bishop";
    }
  });

  hovers("promote-peice", (t) => {
    t.scale = vec2(1.1);
  }, (t) => {
    t.scale = vec2(1);
  });

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

  /*clicks("tile", (p) => {
    destroyAll("highlight");
    destroyAll("move");
  });*/

  clicks("peice", (p) => {
    destroyAll("highlight");
    destroyAll("move");
    if ((selected === null || selected != p) && p.is(curTurn)) {
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
    }
  }); 

  action(() => { // action can also be used to track checks and checkmate.
    //
  });

  init();

  //debug
  //clog(board[0][0].tile);
});
go("main");