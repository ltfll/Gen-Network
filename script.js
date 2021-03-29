let sketch = function (p) {
  // Environment
  let nodesX = 5;
  let nodesY = 5;
  let nodeWidth;
  let ammountNodes;
  let probGenerateNode = 0.5;
  let probRemoveArist = 1;
  let ballSize = 15;

  // Network
  let nodes;
  let listNodes;
  let listArists;

  // Sliders
  let intervalSlider;
  let notesSlider;
  let octavesSlider;
  let baseOctavesSlider;
  let listSliders
  let sliderSelected

  // Sound
  let soundActivated = false
  let parallelSounds = 2;
  let synth;
  let pentatonicScale = [
    "A",
    "C",
    "D",
    "E",
    "G"
  ];
  let baseOctave = 2;
  let numOctaves = 5;
  let velocity = 0.5;
  let minInterval;
  let maxInterval;

  let MIN_INTERVAL = 1000;
  let MAX_INTERVAL = 2000;

  // Images
  let muteImage
  let unmuteImage

  p.preload = () => {
    muteImage = p.loadImage('./img/mute.png');
    unmuteImage = p.loadImage('./img/unmute.png');
  }

  p.setup = () => {
    p.createCanvas(900, 900);
    nodeWidth = p.width / nodesY;
    synth = new p5.PolySynth();
    p.createEnvironment();
    p.createSliders()
    p.getAudioContext().suspend();
  };

  p.createSliders = () => {
    listSliders = []
    listSliders.push(intervalSlider = new Slider("Interval", 10, p.height - 50, p.width / 4 - 30, 20, 0.1, 2))
    listSliders.push(notesSlider = new Slider("Notes", p.width / 4 + 10, p.height - 50, p.width / 4 - 30, 20, 0.1, 2))
    listSliders.push(octavesSlider = new Slider("Octaves", p.width * 2 / 4 + 10, p.height - 50, p.width / 4 - 30, 20, 1, 5))
    listSliders.push(baseOctavesSlider = new Slider("Base Octave", p.width * 3 / 4 + 10, p.height - 50, p.width / 4 - 30, 20, 1, 5))

    intervalSlider.value = 0.5;
    notesSlider.value = 1;
    octavesSlider.value = 5;
    baseOctavesSlider.value = 2;
  }

  p.draw = () => {
    p.background(0);
    p.showNodes();

    minInterval = intervalSlider.value * MIN_INTERVAL
    maxInterval = intervalSlider.value * MAX_INTERVAL

    velocity = notesSlider.value * MAX_INTERVAL

    numOctaves = p.int(octavesSlider.value)
    baseOctave = p.int(baseOctavesSlider.value)

    if (sliderSelected) {
      sliderSelected.updateValue()
    }

    listSliders.forEach(s => {
      s.draw()
    })

    if (soundActivated) {
      p.image(unmuteImage, 0, 0, 33, 33)
    } else {
      p.image(muteImage, 0, 0, 33, 33)
    }
  };

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


    if (p.mouseButton == p.LEFT && !sliderPressed && !audioButtonPressed) {
      p.createEnvironment();
    }
  };

  p.mouseReleased = () => {
    if (sliderSelected) {
      sliderSelected = undefined
    }
  };

  p.showNodes = () => {
    p.ellipseMode(p.CENTER);
    listNodes.forEach((n) => {
      n.update();
      n.show();
    });

    listArists.forEach((a) => {
      a.update();
      a.show();
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
    heightLevel;

    constructor(x, y, size) {
      this.size = size / 3;
      this.position = p.createVector(x * size + size / 2, y * size + size / 2);
      this.arists = [];
      this.randomNode();

      this.note = p.random(pentatonicScale);
      this.active = 0;
      this.heightLevel =
        p.round((numOctaves * (p.height - this.position.y)) / p.height) - 1;
    }

    randomNode() {
      this.shapeColor = p.color(p.random(255), p.random(255), p.random(255));
    }

    show() {
      p.fill(this.shapeColor);
      p.stroke(0);
      p.ellipse(this.position.x, this.position.y, this.size, this.size);

      p.fill(0);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.note, this.position.x, this.position.y + 2);
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
        if (this.from) {
          let octave = baseOctave + this.from.heightLevel;
          let currentNote = this.from.note + p.str(octave);

          synth.play(
            currentNote,
            velocity,
            (this.interval / 1000) * 0.5,
            this.interval / 1000
          );
        }
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

    show() {
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
          ballSize * s,
          ballSize * s
        );
      }
    }
  }

  class Slider {
    name
    pos
    width
    height

    minv
    maxv
    value
    constructor(n, x, y, w, h, mnv, mxv) {
      this.name = n
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
      p.textAlign(p.CENTER, p.TOP)
      p.text(this.name, this.pos.x + this.width / 2, this.pos.y + 25)
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
    }
  }

  p.createNodes = () => {
    nodes = [];
    let ammount = 0;
    do {
      for (let x = 0; x < nodesX; x++) {
        let row = [];
        for (let y = 0; y < nodesY; y++) {
          if (p.random() < probGenerateNode) {
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
      if (p.random() < probRemoveArist && listArists[i].canRemove()) {
        listArists[i].remove();
        listArists.splice(listArists.indexOf(listArists[i]), 1);
      }
      copyList.splice(i, 1);
    }
  };

  p.connectNodes = () => {
    for (let x = 0; x < nodesX; x++) {
      for (let y = 0; y < nodesY; y++) {
        if (nodes[x][y]) {
          // left-right-up-down
          for (let dx = x; dx < nodesX; dx++) {
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
          for (let dy = y; dy < nodesY; dy++) {
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
          for (let dx = x, dy = y; dx < nodesX && dy < nodesY; dx++, dy++) {
            if (nodes[dx][dy] && dx != x && dy != y) {
              nodes[x][y].addArist(new Arist(nodes[x][y], nodes[dx][dy]));
              break;
            }
          }
          for (let dx = x, dy = y; dx < nodesX && dy >= 0; dx++, dy--) {
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
          for (let dx = x, dy = y; dx >= 0 && dy < nodesY; dx--, dy++) {
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