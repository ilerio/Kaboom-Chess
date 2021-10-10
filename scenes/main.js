layers(["board", "game", "ui"]);

const size = 30
const w = 0.45
const b = 0.85
const colorBlack = color(b,b,b)
const colorWhite = color(w,w,w)
const initFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
let board = [
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
]
let x = 0
let y = 0
let pieceTypeFromSymbol = {
  "k": "bking",
  "p": "bpawn",
  "n": "bknight",
  "b": "bbishop",
  "r": "brook",
  "q": "bqueen",
  "K": "wking",
  "P": "wpawn",
  "N": "wknight",
  "B": "wbishop",
  "R": "wrook",
  "Q": "wqueen"
}

class Piece {
  constructor (x,y,p,c) {  
    this.x = x
    this.y = y 
    this.piece = p
    this.color = c
  }
}

function isNumeric(str) {
  if (typeof str != "string") return false
  return !isNaN(str) && !isNaN(parseFloat(str))
}

function loadFEN(fen) {
  let fenArr = []
  let file = []
  let fileIndex = 0
  let rankIndex = 0
  let piecePos = []
  let index = 0

  fenArr = fen.split(" ") //TODO: implement rest of FEN
  console.log("fenArr[0]: ", fenArr[0])

  piecePos = fenArr[0].split("")
  for (let i = 0; i < piecePos.length; i++) {
    let cur = piecePos[i]
    let temp = 0
    if (isNumeric(cur)) {
      for (let j = 0; j < cur; j++) {
        board[fileIndex][rankIndex] = ""
        rankIndex++
      }
    } else if (cur === "/") {
      fileIndex++
      rankIndex = 0
    } else {
      let p = new Piece(0,0,pieceTypeFromSymbol[cur],cur === cur.toUpperCase() ? color(1,1,1) : color(0,0,0))
      board[fileIndex][rankIndex] = p
      rankIndex++
    }
  }

  console.log(board)
}
loadFEN(initFEN);

let curDraggin = null;

// custom component for handling drag & drop behavior
function drag() {

	// the difference between object pos and mouse pos
	let offset = vec2(0);

	return {
		// name of the component
		id: "drag",
		// it requires the "pos" and "area" component
		require: [ "pos", "area", ],
		// "add" is a lifecycle method gets called when the obj is added to scene
		add() {
			// TODO: these need to be checked in reverse order
			// "this" in all methods refer to the obj
			this.clicks(() => {
				if (curDraggin) {
					return;
				}
				curDraggin = this;
				offset = mousePos().sub(this.pos);
				readd(this);
			});
		},
		// "update" is a lifecycle method gets called every frame the obj is in scene
		update() {
			if (curDraggin === this) {
				cursor("move");
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
    x = (size*j)
    y = (size*i)
    add([
      rect(size, size),
      pos(x, y),
      (j+i)%2 === 0 ? colorBlack : colorWhite
    ]);
    x += 15
    y += 15
    if (board[i][j] !== "") {
      add([
        sprite(board[i][j].piece),
        pos(x, y),
        scale(0.5),
        origin("center"),
        drag(),
      ]);
      board[i][j].x = x
      board[i][j].y = y
    }
  }
}