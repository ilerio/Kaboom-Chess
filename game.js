import kaboom from "https://unpkg.com/kaboom/dist/kaboom.mjs";
//import kaboom from "https://unpkg.com/kaboom@2000.2.9/dist/kaboom.mjs"
import {loadAssets} from "./load.js"
//import {} from "./board.js"
//import {} from "./pieces.js"

kaboom({
  global: true,
  background: [ 0, 0, 0, ],
});

loadAssets();

scene("main", (args = {}) => {
  layers(["board", "boarder", "piece", "ui"], "game");

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
  let moveFromHighlight = null;
  let moveToHighlight = null;
  let curTurn = "white";
  let promoteHighlight = null;
  let promotePiece = "queen";
  let ppw = "queen";
  let ppb = "queen"

  /*
    enPasantObj {
      piece,
      color,
      x,
      y,
      turn, // how many moves it has been since this was set
    }
  */
  let enPasantObj = null;
  let possibleEnPasant = false;
  let fenEnPasant = '';
  let halfMoveClock = 0;
  let fullMoveClock = 0;

  /*
    king {
      piece,
      x,
      y,
      isInCheck,
      canLongCastle,
      canShortCastle,
    }
  */
  let whiteKing = {
    "piece": null,
    "x": 0,
    "y": 0,
    "isInCheck": false,
    "canLongCastle": false,
    "canShortCastle": false,
  };
  let blackKing = {
    "piece": null,
    "x": 0,
    "y": 0,
    "isInCheck": false,
    "canLongCastle": false,
    "canShortCastle": false,
  };

  let attackedSquaresWhite = [];
  let attackedSquaresBlack = [];

  let board = [];

  const pieceSpriteMap = {
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
  const fileLetterMap = {
    0:"8",
    1:"7",
    2:"6",
    3:"5",
    4:"4",
    5:"3",
    6:"2",
    7:"1",
  }
  const rankLetterMap = {
    0:"a",
    1:"b",
    2:"c",
    3:"d",
    4:"e",
    5:"f",
    6:"g",
    7:"h",
  }
  const fileLetterUnMap = {
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

  let hoverHighlight = add([
    sprite("border"),
    pos(offsetX, offsetY),
    layer("boarder"),
  ]);
  hoverHighlight.hidden = true;

  function isNumeric(str) {
    if (typeof str !== "string") return false
    return !isNaN(str) && !isNaN(parseFloat(str))
  }

  function loadFEN(fen) {
    let fenArr = [];
    let fileIndex = 0;
    let rankIndex = 0;
    let piecePos = [];
    let castelingRights = [];

    fenArr = fen.split(" ");

    // TODO: some error handling. Verify valid fen string.
    // currently invalid fen string will blow up program
    
    // fenArr[0] - Piece positions
    piecePos = fenArr[0].split("")
    for (let i = 0; i < piecePos.length; i++) {
      let cur = piecePos[i];
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

    // fenArr[1] - Turn - Acive color
    if (fenArr[1] === 'w') {
      curTurn = "white";
    } else {
      curTurn = "black";
    }

    // fenArr[2] - Castling Rights
    castelingRights = fenArr[2].split("");
    for (let i = 0; i < castelingRights.length; i++) {
      if (castelingRights[i] === '-') {
        whiteKing.canLongCastle = false;
        whiteKing.canShortCastle = false;
        blackKing.canLongCastle = false;
        blackKing.canShortCastle = false;
        break;
      }
      switch (castelingRights[i]) {
        case "K": 
          whiteKing.canShortCastle = true;
          break;
        case "Q": 
          whiteKing.canLongCastle = true;
          break;
        case "k": 
          blackKing.canShortCastle = true;
          break;
        case "q": 
          blackKing.canLongCastle = true;
          break;
      }
    }

    // fenArr[3] - En passant target
    if (fenArr[3] !== "-") {
      fenEnPasant = fenArr[3];
    }

    // fenArr[4] - Halfmove clock
    halfMoveClock = parseInt(fenArr[4]);

    // fenArr[5] - Fullmove clock
    fullMoveClock = parseInt(fenArr[5]);
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
    let rank, file, x, y, p
    for(let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {    

        let pos = indexToWorldPos(j,i,false)
        board[i][j].pos = pos;

        if (board[i][j].piece !== null) {
          const p = drawPiece(indexToWorldPos(j,i,false), board[i][j].piece);
          if (board[i][j].piece === "wking") {
            whiteKing.piece = p;
            whiteKing.x = i;
            whiteKing.y = j;
          } else if (board[i][j].piece === "bking") {
            blackKing.piece = p;
            blackKing.x = i;
            blackKing.y = j;
          }
          board[i][j].piece = p;
        }
      }
    }
    if (fenEnPasant !== '') {
      rank = '';
      file = '';
      x = 0;
      y = 0;
      p = null;

      rank = fenEnPasant[0];
      file = fenEnPasant[1];
      x = rankLetterUnMap[rank];
      y = fileLetterUnMap[file];
      p = board[y-1][x].piece;
      enPasantObj = {
        "piece": p,
        "color": getPieceName(p)[0],
        "x": x,
        "y": y,
        "turn": 0,
      }
      fenEnPasant = '';
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
    let color = pieceName[0];

    switch (pieceName) {
      case "wpawn": case "bpawn": 
        moveList = pawnMoveList(p.pos, color);
        break;
      case "wrook": case "brook": 
        moveList = rookMoveList(p.pos, color);
        break;
      case "wknight": case "bknight":
        moveList = knightMoveList(p.pos, color);
        break;
      case "wbishop": case "bbishop": 
        moveList = bishopMoveList(p.pos, color);        
        break;
      case "wqueen": case "bqueen":
        moveList = queenMoveList(p.pos, color);            
        break;
      case "wking": case "bking":
        moveList = kingMoveList(p.pos, color);            
        break;
    }

    return moveList;
  }

  function posAttacked() {
    let p = null;
    for (let i = 0; i <= maxIndex; i++) {
      for (let j = 0; j <= maxIndex; j++) {
        //TODO: finish
      }
    }
  }

  function getAttackingSquares() {

  }

  function drawPosAttacked() {

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

    for (let i = 1; i <= maxIndex; i++) {
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
        }
        break;
      }
    }
    return moveList;
  }

  function kingMoveList(startPos, color) {
    let moveList = [];
    let x = worldPosToIndex(startPos, false).x;
    let y = worldPosToIndex(startPos, false).y;
    let destX = 0;
    let destY = 0;
    let m = null;

    /*
      0,+1  | 0,-1
      +1,0  | -1,0
      +1,+1 | -1,-1
      +1,-1 | -1, +1
    */
    let kingMoveIndexs = [
      {"x": x,"y":y+1},
      {"x": x+1,"y":y+1},
      {"x": x+1,"y":y},
      {"x": x+1,"y":y-1},
      {"x": x,"y":y-1},
      {"x": x-1,"y":y-1},
      {"x": x-1,"y":y},
      {"x": x-1,"y":y+1},
    ]

    for (let i = 0; i < kingMoveIndexs.length; i++) {
      destX = kingMoveIndexs[i].x;
      destY = kingMoveIndexs[i].y;
      if ((destX >= minIndex && destX <= maxIndex) && (destY >= minIndex && destY <= maxIndex)) {
        m = indexToWorldPos(destX,destY);
        if (!moveToPosOccupied(m,color)) {
          moveList.push({
            "pos": m,
            "capture": false
          });
        } else {
          if (!moveToPosHasFriendly(m, color)) {
            moveList.push({
              "pos": m,
              "capture": true,
            });
          }
        }
      }
    }

    return moveList;
  }

  function indexToWorldPos(destX, destY, tile = false) {
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

  // overload function assumes not a tile
  function worldPosToIndex(pos) {
    return worldPosToIndex(pos, false)
  }

  function worldPosToIndex(pos, tile = false) {
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

  function fromToHighlight(from, to) {
    if (moveFromHighlight !== null) destroy(moveFromHighlight);
    moveFromHighlight = add([
      sprite("highlight"),
      pos(from.x,from.y),
      layer("board"),
      origin("center"),
      "highlight-from",
    ]);
    if (moveToHighlight !== null) destroy(moveToHighlight);
    moveToHighlight = add([
      sprite("highlight"),
      pos(to.x,to.y),
      layer("board"),
      origin("center"),
      "highlight-to",
    ]);
  }

  function movePiece(p, dest) {
    let startXIndex = worldPosToIndex(p.pos, false).x;
    let startYIndex = worldPosToIndex(p.pos, false).y;
    let destXIndex = worldPosToIndex(dest, false).x;
    let destYIndex = worldPosToIndex(dest, false).y;
    let pieceName = getPieceName(p);
    let dir = 1;
    let color = getPieceName(p)[0];
    let x = 0;
    let y = 0;
    let temp = null;
    let moveListDest = null;
    let moveList = [];
    let moveType = "move"; // capture | move | check

    fromToHighlight(p.pos, dest)

    if (color === "b") {
      dir *= -1;
    }

    //king
    //casteling:TODO
    
    //enPasant
    if (possibleEnPasant === true) {
      if (Math.abs(startYIndex - destYIndex) === 2) {
        enPasantObj = {
          "piece": p,
          "color": pieceName[0],
          "x": destXIndex,
          "y": (destYIndex+(1*(color === "w" ? +1 : -1))),
          "turn": 0,
        }
      }
      possibleEnPasant = false;
    }

    //capture
    let destPiece = board[destYIndex][destXIndex].piece;
    if (destPiece !== null) {
      destroy(destPiece);
      halfMoveClock = 0;
      moveType = "capture";
    }

    //promote pawn
    if ((p.is("wpawn") || p.is("bpawn"))) {
      if (destYIndex === 7 || destYIndex === 0) {
        temp = p;
        selected = null;
        destroyAll("highlight");
        destroyAll("move");
        p = drawPiece(indexToWorldPos(destXIndex,destYIndex), pieceName[0]+promotePiece);
        destroy(temp);
      }

      //enPasant capture
      if(enPasantObj !== null) {
        if (enPasantObj.x === destXIndex && enPasantObj.y === destYIndex) {
          x = destXIndex;
          y = destYIndex+(1*(dir));
          temp = board[y][x].piece;
          destroy(temp);
          board[y][x].piece = null;
          moveType = "capture";
          enPasantObj = null;
        }
      }

      halfMoveClock = 0;
    }

    if (enPasantObj !== null) {
      enPasantObj.turn++
      if (enPasantObj.turn > 1) {
        possibleEnPasant = false;
        enPasantObj = null;
      }
    }

    // move piece
    p.pos = dest;

    board[destYIndex][destXIndex].piece = p;
    board[startYIndex][startXIndex].piece = null;

    // advance turn
    if (pieceName[0] === "w") {
      curTurn = "black";
    } else {
      fullMoveClock++;
      curTurn = "white";
    }

    halfMoveClock++;
    if (halfMoveClock >= 100) {
      result("50 move draw.")
    }

    // check -> set moveType = "check";

    play(moveType);
    drawPromoteSelection();
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

  function drawPromoteSelection() {
    let q,n,r,b
    destroyAll("promote");
    add ([
      text("promote", {size: 20}),
      indexToWorldPos(9,0,true),
      layer("ui"),
      origin("bot"),
      "promote",
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
    q = add([
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
    n = add([
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
    r = add([
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
    b = add([
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
      let curPos

      if (curTurn === "white") {
        switch (ppw) {
          case "queen":
            curPos = q.pos;
            break;
          case "knight":
            curPos = n.pos;
            break;
          case "rook":
            curPos = r.pos;
            break;
          case "bishop":
            curPos = b.pos;
            break;
        }
      } else {
        switch (ppb) {
          case "queen":
            curPos = q.pos;
            break;
          case "knight":
            curPos = n.pos;
            break;
          case "rook":
            curPos = r.pos;
            break;
          case "bishop":
            curPos = b.pos;
            break;
        }
      }

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

  function result(res) {
    go("result", res);
  }

  function getFenInput() {
    let fen = prompt("Fen:", initFEN);
    if (fen == null || fen == "") {
      //Cancelled
    } else {
      init(fen);
    }
  }

  function clearBoard() {
    board = [
      [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
      [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
      [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
      [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
      [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
      [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
      [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
      [{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null},{id:"",tile:null,piece:null,pos:null}],
    ];
    destroyAll("piece")
  }

  function logInstanceVariables() {
    console.log(`curTurn`, curTurn);
    console.log(`selected`, selected);
    console.log(`curHover`, curHover);
    console.log(`moveFromHighlight`, moveFromHighlight);
    console.log(`moveToHighlight`, moveToHighlight);
    console.log(`promoteHighlight`, promoteHighlight);
    console.log(`promotePiece`, promotePiece);
    console.log(`enPasantObj`, enPasantObj);
    console.log(`possibleEnPasant`, possibleEnPasant);
    console.log(`fenEnPasant`, fenEnPasant);
    console.log(`halfMoveClock`, halfMoveClock);
    console.log(`fullMoveClock`, fullMoveClock);
    console.log(`whiteKing`, whiteKing);
    console.log(`blackKing`, blackKing);
    console.log(`attackedSquaresWhite`, attackedSquaresWhite);
    console.log(`attackedSquaresBlack`, attackedSquaresBlack);
  }

  function init(fen = initFEN) {
    clearBoard();
    loadFEN(fen);
    drawBoard();
    drawPieces();
    drawPromoteSelection();

    //debug | TODO: DELETE
    drawIndexLabels();
  }

  onClick("move", (m) => {
    if (selected !== null) {
      movePiece(selected, m.pos);
    }
  });

  onClick("attack", (m) => {
    if (selected !== null) {
      movePiece(selected, m.pos);
    }
  });

  onClick("promote-piece", (pp) => {
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

    (curTurn === "white") ? ppw = promotePiece : ppb = promotePiece;
  });

  onHover("promote-piece", (t) => {
    t.scale = vec2(1.1);
  }, (t) => {
    t.scale = vec2(1);
  });

  onHover("tile", (t) => {
    if (curHover !== t) {
      hoverHighlight.pos = t.pos;
      readd(hoverHighlight);
      let hoverPiece = objectAtid(t._id).piece;
      if (hoverPiece !== null) {
        hoverHighlight.hidden = false;
      } else {
        hoverHighlight.hidden = true;
      }
    }
    curHover = t;
  });

  onClick("piece", (p) => {
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
      drawMoves(generateMoveList(p));
    } else if (selected === p) {
      selected = null;
    }
  });

  init();

  //debug
  onKeyPress("d", () => {
    logInstanceVariables();
  });

  onKeyPress("f", () => {
    getFenInput();
  });

});

scene("result", (res) => {
  const centerX = ((width()/2));
  const centerY = ((height()/2));
  add ([
    text(res, {size: 50}),
    pos(centerX,centerY),
    origin("center")
  ]);
  const btn = add([
    rect(120, 30),
    pos(centerX,centerY + 60),
    outline(1),
    layer("board"),
    origin("center"),
    area(),
    color(0,0,0),
  ]);
  add ([
    text("new game", {size: 20}),
    pos(centerX,centerY + 60),
    origin("center"),
  ]);
  btn.onClick(() => {
    go("main");
  });
  btn.onHover(() => {
    btn.color = rgb(255,255,255);
  }, () => {
    btn.color = rgb(0,0,0);
    btn.outline = outline(1);
  });
});

onLoad(() => {
  go("main");
});
