let sketch = function (p) {
  // Environment
  let NODES_X = 6;
  let NODES_Y = 6;
  let PROB_GENERATE_NODE = 0.5;
  let PROB_REMOVE_ARIST = 0.5;
  let BALL_SIZE = 15;
  let nodeWidth;
  let ammountNodes;

  // Network
  let nodes;
  let listNodes;
  let listArists;

  // Sliders
  let listSliders
  let sliderSelected
  let intervalSlider;
  let notesSlider;
  let minOctaveSlider;
  let maxOctaveSlider;

  // Buttons
  let listButtons

  // Sound
  let soundActivated = false
  let parallelSounds = 4;
  let polySynth;
  let chromaticScale = [
    "C",
    "D",
    "E",
    "F",
    "G",
    "A",
    "B"
  ];
  let minOctave = 3;
  let maxOctave = 5;
  let dur = 0.1;
  let time = 0;
  let velocity = 0.1;
  let minInterval;
  let maxInterval;
  let uniformSound = true

  let MIN_INTERVAL = 1000;
  let MAX_INTERVAL = 2000;
  
  // Images
  let muteImage
  let unmuteImage

  // Font
  let font;

  p.preload = () => {
    muteImage = p.loadImage('./img/mute.png');
    unmuteImage = p.loadImage('./img/unmute.png');
    font = p.loadFont('./fonts/Roboto-Regular.ttf')
  }

  p.setup = () => {
    p.createCanvas(900, 900);
    nodeWidth = p.width / NODES_Y;
    synth = new p5.PolySynth();
    p.createSliders()
    p.createButtons()
    p.createEnvironment();
    p.textFont(font)
    p.getAudioContext().suspend();
  };

  p.createButtons = () => {
    listButtons = []
    listButtons.push(new Button("Uniform", p.width - 40, 10, 20, 20))
  }

  p.createSliders = () => {
    listSliders = []
    listSliders.push(intervalSlider = new Slider("Speed", "Float", 10, p.height - 50, p.width / 4 - 30, 20, 0.1, 0.5))
    listSliders.push(notesSlider = new Slider("Notes", "Float", p.width / 4 + 10, p.height - 50, p.width / 4 - 30, 20, 0.1, 2))
    listSliders.push(minOctaveSlider = new Slider("Min Octaves", "Integer", p.width * 2 / 4 + 10, p.height - 50, p.width / 4 - 30, 20, 2, 6))
    listSliders.push(maxOctaveSlider = new Slider("Max Octaves", "Integer", p.width * 3 / 4 + 10, p.height - 50, p.width / 4 - 30, 20, 2, 6))

    intervalSlider.value = 0.2;
    notesSlider.value = 1;
    minOctaveSlider.value = 3;
    maxOctaveSlider.value = 5;
  }

  p.draw = () => {
    p.background(0);
    p.showNodes();

    if (sliderSelected) {
      sliderSelected.updateValue()
    }
    p.checkSliders()

    listSliders.forEach(s => {
      s.draw()
    })

    listButtons.forEach(b => {
      b.draw()
    })

    if (soundActivated) {
      p.image(unmuteImage, 0, 0, 33, 33)
    } else {
      p.image(muteImage, 0, 0, 33, 33)
    }
  };

  p.checkSliders = () => {
    if (uniformSound) {
      minInterval = intervalSlider.value * MIN_INTERVAL
      maxInterval = intervalSlider.value * MIN_INTERVAL
    } else {
      minInterval = intervalSlider.value * MIN_INTERVAL
      maxInterval = intervalSlider.value * MAX_INTERVAL
    }
    velocity = notesSlider.value * MAX_INTERVAL

    if (minOctaveSlider.value > maxOctaveSlider.value && sliderSelected == minOctaveSlider) {
      maxOctaveSlider.value = minOctaveSlider.value
    }
    if (minOctaveSlider.value > maxOctaveSlider.value && sliderSelected == maxOctaveSlider) {
      minOctaveSlider.value = maxOctaveSlider.value
    }

    minOctave = p.int(minOctaveSlider.value)
    maxOctave = p.int(maxOctaveSlider.value)
  }

  p.createEnvironment = () => {
    listArists = [];
    listNodes = [];
    p.createNodes();
    p.connectNodes();
    p.randomRemoveArist();
    p.startSound();
  };

  p.startSound = () => {
    for (let i = 0; i < parallelSounds; i++) {
      setTimeout(() => {
        p.random(listNodes).active++;
      }, p.random(maxInterval * parallelSounds));
    }
  };

  p.mousePressed = () => {
    let sliderPressed = false
    listSliders.forEach(s => {
      if (s.checkPressed()) {
        sliderPressed = true;
        sliderSelected = s;
      }
    })

    let audioButtonPressed = false
    if (p.mouseX < 33) {
      if (p.mouseY < 33) {
        audioButtonPressed = true
        if (soundActivated) {
          p.getAudioContext().suspend();
        } else {
          p.userStartAudio();
        }
        soundActivated = !soundActivated
      }
    }

    let buttonPressed = false
    listButtons.forEach(b => {
      if (b.checkPressed()) {
        buttonPressed = true;
        p.buttonsEvent(b)
      }
    })

    if (p.mouseButton == p.LEFT && !sliderPressed && !audioButtonPressed && !buttonPressed) {
      p.createEnvironment();
    }
  };

  p.buttonsEvent = (b) => {
    switch (b.text) {
      case "Uniform":
        uniformSound = !uniformSound
        b.active = uniformSound
        if (uniformSound) {
          p.checkSliders()
          listArists.forEach(a => {
            if (a.active > 0) {
              a.activeTime = p.millis() + p.random(maxInterval, minInterval);;
            }
          })
        }
        break;
    }
  }

  p.mouseReleased = () => {
    if (sliderSelected) {
      sliderSelected = undefined
    }
  };

  p.showNodes = () => {
    p.ellipseMode(p.CENTER);
    listNodes.forEach((n) => {
      n.update();
      n.draw();
    });

    listArists.forEach((a) => {
      a.update();
      a.draw();
    });
  };

  class Node {
    // Data
    size;
    position;
    arists;
    shapeType = 0;
    shapeColor;

    // Sound
    note;
    active;

    constructor(x, y, size) {
      this.size = size / 3;
      this.position = p.createVector(x * size + size / 2, y * size + size / 2);
      this.arists = [];
      this.randomNode();

      this.note = p.random(chromaticScale);
      this.active = 0;
    }

    randomNode() {
      this.shapeColor = p.color(p.random(255), p.random(255), p.random(255));
    }

    draw() {
      p.fill(this.shapeColor);
      p.stroke(0);
      p.ellipse(this.position.x, this.position.y, this.size, this.size);

      let textC = p.brightness(this.shapeColor) < 150 ? 0 : 255;
      p.fill(textC);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.note, this.position.x, this.position.y);
    }

    update() {
      if (this.active > 0) {
        this.randomNode();
      }
      while (this.active > 0) {
        this.active--;
        let arist = p.random(this.arists);
        arist.from = this;
        arist.active++;
      }
    }

    addArist(arist) {
      let canAdd = true;
      let n = arist.getConnectionNode(this);
      n.arists.forEach((a) => {
        if (a.getConnectionNode(n) == this) {
          canAdd = false;
        }
      });
      if (canAdd) {
        this.arists.push(arist);
        n.arists.push(arist);
        listArists.push(arist);
      }
    }

    removeArist(arist) {
      this.arists.splice(this.arists.indexOf(arist), 1);
    }

    check(l, aristBlocked) {
      for (let i = 0; i < this.arists.length; i++) {
        const a = this.arists[i];
        if (a != aristBlocked) {
          let n = a.getConnectionNode(this);
          if (l.indexOf(n) == -1) {
            l.push(n);
            l = n.check(l, aristBlocked);
          }
        }
      }
      return l;
    }
  }

  class Arist {
    // References
    father;
    child;

    // Line
    dirLine;
    baseLine;
    endLine;
    pointColor;

    // Sound
    from;
    active;
    actived;
    activeTime;
    interval = 0;

    constructor(father, child) {
      this.father = father;
      this.child = child;
      this.pointColor = p.color(p.random(255), p.random(255), p.random(255));

      this.active = 0;
      this.actived = false;
      this.activeTime = p.millis();

      this.baseLine = father.position.copy();
      this.endLine = child.position.copy();
      let c = this.baseLine.copy().sub(this.endLine);
      c.normalize();
      c.mult(father.size * 0.75);
      this.baseLine.sub(c);
      this.endLine.add(c);
      this.dirLine = this.endLine.copy().sub(this.baseLine);
    }

    canRemove() {
      let excess =
        this.child.arists.length > 1 && this.father.arists.length > 1;
      let l = [];
      let a = this.father.check(l, this);
      if (excess && a.length == ammountNodes) {
        return true;
      }
      return false;
    }

    remove() {
      this.child.removeArist(this);
      this.father.removeArist(this);
    }

    getConnectionNode(n) {
      if (n == this.child) {
        return this.father;
      } else {
        return this.child;
      }
    }

    update() {
      if (this.active > 0 && !this.actived) {

        this.actived = true;
        this.interval = p.random(maxInterval, minInterval);
        this.activeTime = p.millis() + this.interval;

        this.pointColor = p.color(p.random(255), p.random(255), p.random(255));
        let currentNote = this.from.note + p.str(p.int(p.random(minOctave, maxOctave)))

        synth.play(
          currentNote,
          velocity,
          0,
          this.interval / 1000 * 0.8
        );
      }

      if (this.actived && p.millis() > this.activeTime) {
        this.actived = false;
        if (this.from) {
          while (this.active > 0) {
            this.active--;
            this.getConnectionNode(this.from).active++;
          }
          this.from = undefined;
        }
      }
    }

    draw() {
      p.stroke(255);
      p.strokeWeight(1);
      p.line(this.baseLine.x, this.baseLine.y, this.endLine.x, this.endLine.y);

      if (this.activeTime < p.millis()) return;
      let dl = this.dirLine.copy();
      let v = p.map(this.activeTime - p.millis(), 0, this.interval, 0, 1);
      let sv = p.sin(v * (p.PI / 2));
      dl.mult(sv);

      if (this.from) {
        let s;
        if (v < 0.5) {
          s = p.map(v, 0, 0.5, 0, 1);
        } else {
          s = p.map(v, 0.5, 1, 1, 0);
        }

        let child = this.getConnectionNode(this.from);
        let fatherPosition = child.position.copy();
        let childPosition = this.from.position.copy();
        let diff = fatherPosition.copy().sub(childPosition);
        diff.normalize();
        diff.mult(this.from.size * 0.75);
        fatherPosition.sub(diff);
        childPosition.add(diff);

        let inverse = 1;
        if (child == this.child) {
          inverse = -1;
        } else {
          inverse = 1;
        }

        p.fill(this.pointColor);
        p.noStroke();
        p.ellipseMode(p.CENTER);
        p.ellipse(
          fatherPosition.x + dl.x * inverse,
          fatherPosition.y + dl.y * inverse,
          BALL_SIZE * s,
          BALL_SIZE * s
        );
      }
    }
  }

  class Slider {
    name
    type
    pos
    width
    height

    minv
    maxv
    value
    constructor(n, t, x, y, w, h, mnv, mxv) {
      this.name = n
      this.type = t
      this.pos = p.createVector(x, y)
      this.width = w
      this.height = h
      this.minv = mnv
      this.maxv = mxv
      this.value = p.map(0.5, 0, 1, mnv, mxv)
    }

    draw() {
      p.noStroke()
      p.fill(200, 200, 200)
      p.rectMode(p.CORNER)
      p.rect(this.pos.x, this.pos.y + this.height / 4, this.width, this.height / 2, 10)

      p.fill(255)
      p.ellipseMode(p.CENTER)

      let sliderPosX = p.map(this.value, this.minv, this.maxv, this.pos.x, this.pos.x + this.width)
      sliderPosX = p.min(this.pos.x + this.width, p.max(sliderPosX, this.pos.x))

      p.ellipse(sliderPosX, this.pos.y + this.height / 2, this.height, this.height)

      p.fill(255)
      p.textSize(14)
      p.textAlign(p.CENTER, p.TOP)
      p.text(this.name + " (" + p.nfc(this.value, this.type == "Integer" ? 0 : 2) + ")", this.pos.x + this.width / 2, this.pos.y + 25)
    }

    checkPressed() {
      if (p.mouseX >= this.pos.x && p.mouseX <= this.pos.x + p.width) {
        if (p.mouseY >= this.pos.y && p.mouseY <= this.pos.y + p.height) {
          return true
        }
      }
      return false
    }

    updateValue() {
      this.value = p.map(p.mouseX, this.pos.x, this.pos.x + this.width, this.minv, this.maxv)
      this.value = p.min(this.maxv, p.max(this.value, this.minv))
      if (this.type == "Integer") {
        this.value = p.round(this.value)
      }
    }
  }

  class Button {
    text
    pos
    width
    height

    active

    constructor(t, x, y, w, h) {
      this.text = t
      this.pos = p.createVector(x, y)
      this.width = w
      this.height = h
      this.active = true
    }

    draw() {
      if (this.active) {
        p.fill(80, 198, 241)
      } else {
        p.fill(255)
      }
      p.rectMode(p.CORNER)
      p.rect(this.pos.x, this.pos.y, this.width, this.height, 5)

      p.textSize(14)
      p.textAlign(p.RIGHT, p.CENTER)
      p.text(this.text, this.pos.x - 5, this.pos.y + this.height / 2 - 2)
    }

    checkPressed() {
      if (p.mouseX >= this.pos.x && p.mouseX <= this.pos.x + p.width) {
        if (p.mouseY >= this.pos.y && p.mouseY <= this.pos.y + p.height) {
          return true
        }
      }
      return false
    }

  }

  p.createNodes = () => {
    nodes = [];
    let ammount = 0;
    do {
      for (let x = 0; x < NODES_X; x++) {
        let row = [];
        for (let y = 0; y < NODES_Y; y++) {
          if (p.random() < PROB_GENERATE_NODE) {
            let n = new Node(x, y, nodeWidth);
            row.push(n);
            listNodes.push(n);
            ammount++;
          } else {
            row.push(null);
          }
        }
        nodes.push(row);
      }
    } while (ammount == 0);
    ammountNodes = ammount;
  };

  p.randomRemoveArist = () => {
    let copyList = listArists.slice();
    while (copyList.length > 0) {
      let i = p.int(p.random(copyList.length));
      if (p.random() < PROB_REMOVE_ARIST && listArists[i].canRemove()) {
        listArists[i].remove();
        listArists.splice(listArists.indexOf(listArists[i]), 1);
      }
      copyList.splice(i, 1);
    }
  };

  p.connectNodes = () => {
    for (let x = 0; x < NODES_X; x++) {
      for (let y = 0; y < NODES_Y; y++) {
        if (nodes[x][y]) {
          // left-right-up-down
          for (let dx = x; dx < NODES_X; dx++) {
            if (nodes[dx][y] && dx != x) {
              nodes[x][y].addArist(new Arist(nodes[x][y], nodes[dx][y]));
              break;
            }
          }
          for (let dx = x; dx >= 0; dx--) {
            if (nodes[dx][y] && dx != x) {
              nodes[x][y].addArist(new Arist(nodes[x][y], nodes[dx][y]));
              break;
            }
          }
          for (let dy = y; dy < NODES_Y; dy++) {
            if (nodes[x][dy] && dy != y) {
              nodes[x][y].addArist(new Arist(nodes[x][y], nodes[x][dy]));
              break;
            }
          }
          for (let dy = y; dy >= 0; dy--) {
            if (nodes[x][dy] && dy != y) {
              nodes[x][y].addArist(new Arist(nodes[x][y], nodes[x][dy]));
              break;
            }
          }

          // diagonal left-right-up-down
          for (let dx = x, dy = y; dx < NODES_X && dy < NODES_Y; dx++, dy++) {
            if (nodes[dx][dy] && dx != x && dy != y) {
              nodes[x][y].addArist(new Arist(nodes[x][y], nodes[dx][dy]));
              break;
            }
          }
          for (let dx = x, dy = y; dx < NODES_X && dy >= 0; dx++, dy--) {
            if (nodes[dx][dy] && dx != x && dy != y) {
              nodes[x][y].addArist(new Arist(nodes[x][y], nodes[dx][dy]));
              break;
            }
          }
          for (let dx = x, dy = y; dx >= 0 && dy >= 0; dx--, dy--) {
            if (nodes[dx][dy] && dx != x && dy != y) {
              nodes[x][y].addArist(new Arist(nodes[x][y], nodes[dx][dy]));
              break;
            }
          }
          for (let dx = x, dy = y; dx >= 0 && dy < NODES_Y; dx--, dy++) {
            if (nodes[dx][dy] && dx != x && dy != y) {
              nodes[x][y].addArist(new Arist(nodes[x][y], nodes[dx][dy]));
              break;
            }
          }
        }
      }
    }
  };
};

let insta = new p5(sketch)
