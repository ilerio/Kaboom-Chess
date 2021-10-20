//import kaboom from "https://unpkg.com/kaboom@next/dist/kaboom.mjs";
import kaboom from "https://unpkg.com/kaboom@2000.0.0-beta.24/dist/kaboom.mjs"
import {dlog, clog} from "./helpers.js"
import {loadAssets} from "./load.js"
//import {} from "./board.js"
//import {} from "./pieces.js"

kaboom({
  global: true,
  background: [ 0, 0, 0, ],
});

loadAssets();

scene("main", (args = {}) => {
  layers(["board", "boarder", "piece", "ui"]);

  const size = 60;
  const offsetX = ((width()/2) - 240);
  const offsetY = ((height()/2) - 240);
  const piecePosOffset = 30;
  const colorBlack = color(135,175,85);
  const colorWhite = color(255,255,205);

  const maxIndex = 7;
  const minIndex = 0;

  const initFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  let curHover = null;
  let selected = null;
  let curTurn = "white";
  let promoteHighlight = null;
  let promotePiece = "queen";
  /*
    enPasantObj {
      piece,
      color,
      x,
      y,
      dest,
      turn, // how many moves it has been since this was set
    }
  */
  let enPasantObj = null;
  let possibleEnPasant = false;
  let fiftyMoveRule = 0;

  /*
    king {
      piece,
      isInCheck,
      canLongCastle,
      canShortCastle,
    }
  */
  let whiteKing = null;
  let blackKing = null;

  let pinnedPeicesBlack = [];
  let pinnedPeicesWhite = [];

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
    if (typeof str !== "string") return false
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
      if (isNumeric(cur)) {
        for (let j = 0; j < cur; j++) {
          board[rankIndex][fileIndex].id = rankLetterMap[rankIndex]+fileLetterMap[fileIndex];
          board[rankIndex][fileIndex].piece = null;
          fileIndex++;
        }
      } else if (cur === "/") {
        rankIndex++;
        fileIndex = 0;
      } else {
        board[rankIndex][fileIndex].id = rankLetterMap[rankIndex]+fileLetterMap[fileIndex];
        board[rankIndex][fileIndex].piece = pieceSpriteMap[cur];
        fileIndex++;
      }
    }
  }

  function drawIndexLabels() {
    for(let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        let x = (size*j) + offsetX;
        let y = (size*i) + offsetY;
        // index labeling
        if (j === 0) {
          add ([
            text(i.toString(), {size: 30}),
            pos(x - 50,y + 20),
            color(255, 0, 0),
          ]);
        }
        if (i === 7) {
          add ([
            text(j.toString(), {size: 30}),
            pos(x + 20,y + 90),
            color(255, 0, 0),
          ]);
        }
      }
    }
  }

  function drawBoard() {
    for(let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        let x = (size*j) + offsetX;
        let y = (size*i) + offsetY;

        // labeling
        if (j === 0) {
          add ([
            text(fileLetterMap[i], {size: 30}),
            pos(x - 25,y + 20),
          ]);
        }
        if (i === 7) {
          add ([
            text(rankLetterMap[j], {size: 30}),
            pos(x + 20,y + 60),
          ]);
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

  function drawPieces() {
    for(let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {    

        let pos = indexToWorldPos(j,i,false)
        board[i][j].pos = pos;

        if (board[i][j].piece !== null) {
          const p = drawPiece(indexToWorldPos(j,i,false), board[i][j].piece);
          if (board[i][j].piece === "wking" && whiteKing === null) {
            whiteKing = {
              "piece": p,
              "isInCheck": false,
              "canLongCastle": true,
              "canShortCastle": true,
            }
          } else if (board[i][j].piece === "bking" && blackKing === null) {
            blackKing = {
              "piece": p,
              "isInCheck": false,
              "canLongCastle": true,
              "canShortCastle": true,
            }
          }
          board[i][j].piece = p;
        }
      }
    }
  }

  function drawPiece(pos, pieceName) {
    const p = add([
      sprite(pieceName),
      pos,
      area(),
      scale(1),
      origin("center"),
      layer("piece"),
      "piece",
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

  function getPieceName(p) {
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
    let pieceName = getPieceName(p);

    switch (pieceName) {
      case "wpawn": case "bpawn": 
        moveList = pawnMoveList(p.pos, pieceName[0]);
        break;
      case "wrook": case "brook": 
        moveList = rookMoveList(p.pos, pieceName[0]);
        break;
      case "wknight": case "bknight":
        moveList = knightMoveList(p.pos, pieceName[0]);
        break;
      case "wbishop": case "bbishop": 
        moveList = bishopMoveList(p.pos, pieceName[0]);        
        break;
      case "wqueen": case "bqueen":
        moveList = queenMoveList(p.pos, pieceName[0]);            
        break;
      case "wking": case "bking":
        moveList = kingMoveList(p.pos, pieceName[0]);            
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
    let y1 = 0;

    if (color === "w") {
      // -1 because moving "up" the bord is moving 
      // in the negative y direction array wise.
      dir *= -1; 
    }
    y1 = (y+(1*dir));

    if (y1 >= minIndex && y1 <= maxIndex) { 

      // regular move
      if (board[y+(1*dir)][x].piece === null) {
        m = indexToWorldPos(x, y1, false);
        moveList.push({
          "pos": m,
          "capture": false,
        });
      }

      // capture
      if (x+1 >= minIndex && x+1 <= maxIndex) {
        m = indexToWorldPos(x+1, y1, false);
        if (isMoveCapture(m, color)) {
          moveList.push({
            "pos": m,
            "capture": true,
          });
        }
      }
      if (x-1 >= minIndex && x-1 <= maxIndex) {
        m = indexToWorldPos(x-1, y1, false);
        if (isMoveCapture(m, color)) {
          moveList.push({
            "pos": m,
            "capture": true,
          });
        }
      }

      //enPasant capture
      if (enPasantObj !== null) {
        if (enPasantObj.color !== color && y1 === enPasantObj.y) {
          if (x-1 === enPasantObj.x) {
            m = indexToWorldPos(x-1, y1, false);
            moveList.push({
              "pos": m,
              "capture": true,
            });
          } else if(x+1 === enPasantObj.x) {
            m = indexToWorldPos(x+1, y1, false);
            moveList.push({
              "pos": m,
              "capture": true,
            });
          }
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
        possibleEnPasant = true;
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

  function queenMoveList(startPos, color) {
    let moveList = [];
    let diag = [];
    let lateral = [];

    diag = bishopMoveList(startPos, color);
    lateral = rookMoveList(startPos, color);

    moveList = diag.concat(lateral)

    return moveList;
  }

  function kingMoveList(startPos, color) {return []}

  function bishopMoveList(startPos, color) {
    let moveList = [];
    let upRight = [];
    let upLeft = [];
    let downRight = [];
    let downLeft = [];
    let x = worldPosToIndex(startPos, false).x;
    let y = worldPosToIndex(startPos, false).y;

    upRight = slidingMoves(x,y,1,1,color);
    downLeft = slidingMoves(x,y,-1,-1,color);
    upLeft = slidingMoves(x,y,-1,1,color);
    downRight = slidingMoves(x,y,1,-1,color);

    moveList = upRight.concat(downLeft.concat(upLeft.concat(downRight)));

    return moveList;
  }

  function rookMoveList(startPos, color) {
    let moveList = [];
    let up = [];
    let left = [];
    let right = [];
    let down = [];
    let x = worldPosToIndex(startPos, false).x;
    let y = worldPosToIndex(startPos, false).y;

    up = slidingMoves(x,y,0,1,color);
    left = slidingMoves(x,y,-1,0,color);
    right = slidingMoves(x,y,1,0,color);
    down = slidingMoves(x,y,0,-1,color);

    moveList = up.concat(left.concat(right.concat(down)));

    return moveList;
  }

  function slidingMoves(startX, startY, dirX, dirY, color) {
    let moveList = [];
    let xi = 0;
    let yi = 0;
    let m = null;

    for (let i = 1; i < maxIndex; i++) {
      xi = startX + (i*dirX);
      yi = startY + (i*dirY);

      if (xi > maxIndex || xi < minIndex) break;
      if (yi > maxIndex || yi < minIndex) break;

      m = indexToWorldPos(xi, yi);
      if (!moveToPosOccupied(m, color)) {
        moveList.push({
          "pos": m,
          "capture": false,
        });
      } else {
        if (!moveToPosHasFriendly(m, color)) {
          moveList.push({
            "pos": m,
            "capture": true,
          });
        } else {
          if (!moveToPosHasFriendly(m, color)) {
            moveList.push({
              "pos": m,
              "capture": false,
            });
          }
        }
        break;
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
      x = (size*destX) + offsetX + piecePosOffset;
      y = (size*destY) + offsetY + piecePosOffset;
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
      x = (pos.x - (offsetX + piecePosOffset)) / size;
      y = (pos.y - (offsetY + piecePosOffset)) / size;
    }

    return {"x": x, "y": y};
  }

  function movePiece(p, dest) {
    let startXIndex = worldPosToIndex(p.pos, false).x;
    let startYIndex = worldPosToIndex(p.pos, false).y;
    let destXIndex = worldPosToIndex(dest, false).x;
    let destYIndex = worldPosToIndex(dest, false).y;
    let pieceName = getPieceName(p);
    let dir = 1;
    let color = getPieceName(p)[0];
    let moveType = "move"; // capture | move | check

    if (color === "b") {
      dir *= -1;
    }
    
    //enPasant
    if (possibleEnPasant === true) {
      if (Math.abs(startYIndex - destYIndex) === 2) {
        enPasantObj = {
          "piece": p,
          "color": pieceName[0],
          "x": destXIndex,
          "y": (destYIndex+(1*(color === "w" ? +1 : -1))),
          "dest": dest, //*
          "turn": 0,
        }
      }
      possibleEnPasant = false;
    }

    //capture
    let destPiece = board[destYIndex][destXIndex].piece;
    if (destPiece !== null) {
      destroy(destPiece);
      fiftyMoveRule = 0;
      moveType = "capture";
    }

    //promote pawn
    if ((p.is("wpawn") || p.is("bpawn"))) {
      if (destYIndex === 7 || destYIndex === 0) {
        let temp = p;
        selected = null;
        destroyAll("highlight");
        destroyAll("move");
        p = drawPiece(indexToWorldPos(destXIndex,destYIndex), pieceName[0]+promotePiece);
        destroy(temp);
      }

      //enPasant capture
      if(enPasantObj !== null) {
        if (enPasantObj.x === destXIndex && enPasantObj.y === destYIndex) {
          let x = destXIndex;
          let y = destYIndex+(1*(dir));
          let p = board[y][x].piece;
          destroy(p);
          board[y][x].piece = null;
          moveType = "capture";
        }
      }

      fiftyMoveRule = 0;
    }

    if (enPasantObj !== null) {
      enPasantObj.turn++
      if (enPasantObj.turn > 1) {
        possibleEnPasant = false;
        enPasantObj = null;
      }
    }

    p.pos = dest;

    board[destYIndex][destXIndex].piece = p;
    board[startYIndex][startXIndex].piece = null;

    // advance turn
    if (pieceName[0] === "w") {
      curTurn = "black";
    } else {
      curTurn = "white";
    }

    fiftyMoveRule += 0.5;
    if (fiftyMoveRule > 50) {
      //draw TODO
    }

    // check -> set moveType = "check";

    play(moveType);
    drawPromote();
  }

  function isMoveCapture(move, color) {
    let pos = move.pos;
    let x = worldPosToIndex(pos, false).x;
    let y = worldPosToIndex(pos, false).y;
    let p = board[y][x].piece;

    if (p === null) return false;

    let name = getPieceName(p);

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

    let name = getPieceName(p);

    if (name[0] === color) {
      return true;
    }

    return false;
  }

  function moveToPosOccupied(move, color) {
    return isMoveCapture(move, color) || moveToPosHasFriendly(move, color);
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
    add([
      sprite(curTurn[0]+"queen"),
      indexToWorldPos(9,0,true),
      area(),
      scale(1),
      origin("top"),
      layer("piece"),
      "promote",
      "promote-piece",
      "promote-queen",
    ]);
    add([
      sprite(curTurn[0]+"knight"),
      indexToWorldPos(9,1,true),
      area(),
      scale(1),
      origin("top"),
      layer("piece"),
      "promote",
      "promote-piece",
      "promote-knight",
    ]);
    add([
      sprite(curTurn[0]+"rook"),
      indexToWorldPos(9,2,true),
      area(),
      scale(1),
      origin("top"),
      layer("piece"),
      "promote",
      "promote-piece",
      "promote-rook",
    ]);
    add([
      sprite(curTurn[0]+"bishop"),
      indexToWorldPos(9,3,true),
      area(),
      scale(1),
      origin("top"),
      layer("piece"),
      "promote",
      "promote-piece",
      "promote-bishop",
    ]);
    if (promoteHighlight !== null) {
      let curPos = promoteHighlight.pos
      promoteHighlight = add([
        sprite("highlight"),
        pos(curPos.x, curPos.y),
        layer("board"),
        origin("top"),
        "promote",
        "promote-border",
      ]);
    } else {
      promoteHighlight = add([
        sprite("highlight"),
        indexToWorldPos(9,0,true),
        layer("board"),
        origin("top"),
        "promote",
        "promote-border",
      ]);
    }
  }

  function init() {
    loadFEN(initFEN);
    drawBoard();
    drawPieces();
    drawPromote();

    //debug | TODO: DELETE
    drawIndexLabels();
  }

  clicks("move", (m) => {
    if (selected !== null) {
      movePiece(selected, m.pos);
    }
  });

  clicks("attack", (m) => {
    if (selected !== null) {
      movePiece(selected, m.pos);
    }
  });

  clicks("promote-piece", (pp) => {
    promoteHighlight.pos = pp.pos;

    if (pp.is("promote-queen")) {
      promotePiece = "queen";
    } else if (pp.is("promote-knight")) {
      promotePiece = "knight";
    } else if (pp.is("promote-rook")) {
      promotePiece = "rook";
    } else if (pp.is("promote-bishop")) {
      promotePiece = "bishop";
    }
  });

  hovers("promote-piece", (t) => {
    t.scale = vec2(1.1);
  }, (t) => {
    t.scale = vec2(1);
  });

  hovers("tile", (t) => {
    if (curHover !== t) {
      hoverHight.pos = t.pos;
      readd(hoverHight);
      let hoverPiece = objectAtid(t._id).piece;
      if (hoverPiece !== null) {
        hoverHight.hidden = false;
      } else {
        hoverHight.hidden = true;
      }
    }
    curHover = t;
  });

  clicks("piece", (p) => {
    destroyAll("highlight");
    destroyAll("move");
    if ((selected === null || selected !== p) && p.is(curTurn)) {
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

  init();

  //debug
  //clog(board[0][0]);
});
go("main");