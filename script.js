let sketch = function (p) {

  // Environment
  let NODES_X = 6;
  let NODES_Y = 6;
  let PROB_GENERATE_NODE = 0.5;
  let PROB_REMOVE_ARIST = 0.5;
  let nodeWidth;
  let seed;

  // Network
  let nodeGrids;
  let ammountNodes;
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
  let AMOUNT_PARALLEL_NOTES = 4;
  let MIN_INTERVAL_TIME = 1000;
  let MAX_INTERVAL_TIME = 1500;
  let synth;
  let minInterval;
  let maxInterval;
  let minOctave = 3;
  let maxOctave = 5;
  let velocity = 0.4;
  let soundActivated = false;
  let uniformSound = true

  let chromaticScale = ["C", "E", "D", "F", "G", "A", "B"];
  let majorPent = ['C', 'D', 'E', 'G', 'A']
  let minorPent = ['C', 'Eb', 'F', 'G', 'Bb']
  let hirajoshi = ['C', 'D', 'Eb', 'G', 'Ab']
  let inSen = ['C', 'Db', 'F', 'G', 'Bb']
  let iwato = ['C', 'Db', 'F', 'Gb', 'Bb']
  let kumoi = ['C', 'D', 'Eb', 'G', 'A']
  let whole = ['C', 'D', 'E', 'F', 'Ab', 'Bb']
  let scales = [chromaticScale, majorPent, minorPent, hirajoshi, inSen, iwato, kumoi, whole,]
  let scaleIndex = 0

  // Images
  let muteImage
  let unmuteImage

  // Font
  let font;

  p.preload = () => {
    // Load files
    muteImage = p.loadImage('./img/mute.png');
    unmuteImage = p.loadImage('./img/unmute.png');
    font = p.loadFont('./fonts/Roboto-Regular.ttf')
  }

  p.setup = () => {
    p.createCanvas(900, 900);
    nodeWidth = p.width / NODES_Y;  // calculate node size
    p.textFont(font)  // set font

    // Init. audio system
    synth = new p5.PolySynth();
    synth.setADSR(2, 2, 0, 0)
    synth.disconnect()
    new p5.Reverb().process(synth, 1, 80);

    // Init. visual
    p.createSliders()
    p.createButtons()
    p.createEnvironment(true);

    // p.getAudioContext().suspend();  // Default sound disabled
  };

  p.createEnvironment = (generateSeed) => {
    if (generateSeed) {
      seed = new Date().getMilliseconds()
    }
    p.randomSeed(seed)

    p.createNodes();
    p.connectNodes();
    p.randomRemoveArist();
    p.startSound();
  };

  p.createNodes = () => {
    listNodes = [];
    nodeGrids = [];
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
        nodeGrids.push(row);
      }
    } while (ammount == 0);
    ammountNodes = ammount;
  };

  p.connectNodes = () => {
    listArists = [];
    for (let x = 0; x < NODES_X; x++) {
      for (let y = 0; y < NODES_Y; y++) {
        if (nodeGrids[x][y]) {
          // Cross connections
          for (let dx = x; dx < NODES_X; dx++) {
            if (nodeGrids[dx][y] && dx != x) {
              nodeGrids[x][y].addArist(new Arist(nodeGrids[x][y], nodeGrids[dx][y]));
              break;
            }
          }
          for (let dx = x; dx >= 0; dx--) {
            if (nodeGrids[dx][y] && dx != x) {
              nodeGrids[x][y].addArist(new Arist(nodeGrids[x][y], nodeGrids[dx][y]));
              break;
            }
          }
          for (let dy = y; dy < NODES_Y; dy++) {
            if (nodeGrids[x][dy] && dy != y) {
              nodeGrids[x][y].addArist(new Arist(nodeGrids[x][y], nodeGrids[x][dy]));
              break;
            }
          }
          for (let dy = y; dy >= 0; dy--) {
            if (nodeGrids[x][dy] && dy != y) {
              nodeGrids[x][y].addArist(new Arist(nodeGrids[x][y], nodeGrids[x][dy]));
              break;
            }
          }

          // Diagonal connections
          for (let dx = x, dy = y; dx < NODES_X && dy < NODES_Y; dx++, dy++) {
            if (nodeGrids[dx][dy] && dx != x && dy != y) {
              nodeGrids[x][y].addArist(new Arist(nodeGrids[x][y], nodeGrids[dx][dy]));
              break;
            }
          }
          for (let dx = x, dy = y; dx < NODES_X && dy >= 0; dx++, dy--) {
            if (nodeGrids[dx][dy] && dx != x && dy != y) {
              nodeGrids[x][y].addArist(new Arist(nodeGrids[x][y], nodeGrids[dx][dy]));
              break;
            }
          }
          for (let dx = x, dy = y; dx >= 0 && dy >= 0; dx--, dy--) {
            if (nodeGrids[dx][dy] && dx != x && dy != y) {
              nodeGrids[x][y].addArist(new Arist(nodeGrids[x][y], nodeGrids[dx][dy]));
              break;
            }
          }
          for (let dx = x, dy = y; dx >= 0 && dy < NODES_Y; dx--, dy++) {
            if (nodeGrids[dx][dy] && dx != x && dy != y) {
              nodeGrids[x][y].addArist(new Arist(nodeGrids[x][y], nodeGrids[dx][dy]));
              break;
            }
          }
        }
      }
    }
  };

  // Remove connections randomly
  p.randomRemoveArist = () => {
    let copyList = listArists.slice();  // get copy of the list

    while (copyList.length > 0) { // as long as there are connections in the list
      let i = p.int(p.random(copyList.length)); // get rangom connection
      if (p.random() < PROB_REMOVE_ARIST && listArists[i].canRemove()) {  // check if can be removed
        listArists[i].remove();
        listArists.splice(listArists.indexOf(listArists[i]), 1);
      }
      copyList.splice(i, 1);
    }
  };

  p.createButtons = () => {
    listButtons = []
    listButtons.push(new Button("Uniform", p.width - 40, 10, 20, 20))
  }

  p.createSliders = () => {
    listSliders = []
    listSliders.push(intervalSlider = new Slider("Speed", "Float", 10, p.height - 30, p.width / 4 - 30, 20, 0.1, 0.5))
    listSliders.push(notesSlider = new Slider("Notes", "Integer", p.width / 4 + 10, p.height - 30, p.width / 4 - 30, 20, 0, scales.length - 1))
    listSliders.push(minOctaveSlider = new Slider("Min Octaves", "Integer", p.width * 2 / 4 + 10, p.height - 30, p.width / 4 - 30, 20, 2, 6))
    listSliders.push(maxOctaveSlider = new Slider("Max Octaves", "Integer", p.width * 3 / 4 + 10, p.height - 30, p.width / 4 - 30, 20, 2, 6))

    // Set default values
    intervalSlider.value = 0.2;
    notesSlider.value = 0;
    minOctaveSlider.value = 3;
    maxOctaveSlider.value = 6;
  }

  p.startSound = () => {
    synth.noteRelease() // cancel actual notes
    for (let i = 0; i < AMOUNT_PARALLEL_NOTES; i++) {
      p.random(listNodes).activeNotes++;
    }
  };

  p.draw = () => {
    p.background(0);

    // Update actual slider
    if (sliderSelected) {
      sliderSelected.updateValue()
    }
    p.getSliderValues() // set values to variables

    p.drawNodes();
    listSliders.forEach(s => {
      s.draw()
    })
    listButtons.forEach(b => {
      b.draw()
    })
    if (soundActivated) {
      p.image(unmuteImage, 5, 5, 33, 33)
    } else {
      p.image(muteImage, 5, 5, 33, 33)
    }
  };

  p.drawNodes = () => {
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

  p.mousePressed = () => {
    // Check if slider is pressed
    let sliderPressed = false
    listSliders.forEach(s => {
      if (s.checkPressed()) {
        sliderPressed = true;
        sliderSelected = s;
      }
    })

    // Check if audio button is pressed
    let audioButtonPressed = false
    if (p.mouseX >= 5 && p.mouseX < 33) {
      if (p.mouseY >= 5 && p.mouseY < 33) {
        audioButtonPressed = true
        if (soundActivated) {
          synth.noteRelease()
          p.getAudioContext().suspend();
        } else {
          p.userStartAudio();
          synth.noteRelease()
        }
        soundActivated = !soundActivated
      }
    }

    // Check if some button is pressed
    let buttonPressed = false
    listButtons.forEach(b => {
      if (b.checkPressed()) {
        buttonPressed = true;
        p.buttonsEvent(b)
      }
    })

    // Create new environment if none of the previous elections is true
    if (p.mouseButton == p.LEFT && !sliderPressed && !audioButtonPressed && !buttonPressed) {
      p.createEnvironment(true);
    }
  };

  p.mouseReleased = () => {
    // Drop slider selection
    if (sliderSelected) {

      // Generate the same environment
      if (sliderSelected == notesSlider) {
        p.createEnvironment(false)
      }
      sliderSelected = undefined
    }
  };

  p.getSliderValues = () => {
    if (uniformSound) { // same value (all notes have the same length of time)
      minInterval = intervalSlider.value * MIN_INTERVAL_TIME
      maxInterval = intervalSlider.value * MIN_INTERVAL_TIME
    } else {  // random values (all notes have different length of time)
      minInterval = intervalSlider.value * MIN_INTERVAL_TIME
      maxInterval = intervalSlider.value * MAX_INTERVAL_TIME
    }
    scaleIndex = p.int(notesSlider.value) // select scale

    // Update octaves
    if (minOctaveSlider.value > maxOctaveSlider.value && sliderSelected == minOctaveSlider) {
      maxOctaveSlider.value = minOctaveSlider.value
    }
    if (minOctaveSlider.value > maxOctaveSlider.value && sliderSelected == maxOctaveSlider) {
      minOctaveSlider.value = maxOctaveSlider.value
    }
    minOctave = p.int(minOctaveSlider.value)
    maxOctave = p.int(maxOctaveSlider.value)
  }

  // When some button is pressed
  p.buttonsEvent = (b) => {
    switch (b.text) {
      case "Uniform":
        uniformSound = !uniformSound
        b.active = uniformSound

        // Update all the current notes to sync
        if (uniformSound) {
          p.getSliderValues()
          listArists.forEach(a => {
            if (a.activeNotes > 0) {
              a.activeTime = p.millis() + p.random(maxInterval, minInterval);;
            }
          })
        }
        break;
    }
  }

  class Node {
    // Data
    size;
    position;
    arists;
    shapeColor;

    // Sound
    note;
    activeNotes;

    constructor(x, y, size) {
      this.size = size / 3;
      this.position = p.createVector(x * size + size / 2, y * size + size / 2);
      this.arists = [];
      this.generateColor();

      this.note = p.random(scales[scaleIndex]);
      this.activeNotes = 0;
    }

    generateColor() {
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

    // Check available notes
    update() {
      if (this.activeNotes > 0) {
        this.generateColor();
      }
      while (this.activeNotes > 0) {
        this.activeNotes--;
        let arist = p.random(this.arists);
        arist.from = this;
        arist.activeNotes++;
      }
    }

    addArist(arist) {
      let canAdd = true;

      // Check if the neighbor is actually connected
      let n = arist.getNeighborNode(this);
      n.arists.forEach((a) => {
        if (a.getNeighborNode(n) == this) {
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

    // Check if removing the current arist separates the system into different parts
    check(l, aristBlocked) {
      for (let i = 0; i < this.arists.length; i++) {
        const a = this.arists[i];
        if (a != aristBlocked) {
          let n = a.getNeighborNode(this);
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
    activeNotes;
    actived;
    activeTime;
    interval = 0;

    constructor(father, child) {
      this.father = father;
      this.child = child;
      this.pointColor = p.color(p.random(255), p.random(255), p.random(255));

      this.activeNotes = 0;
      this.actived = false;
      this.activeTime = p.millis();

      // Calculate line size and opsition
      this.baseLine = father.position.copy();
      this.endLine = child.position.copy();
      let c = this.baseLine.copy().sub(this.endLine);
      c.normalize();
      c.mult(father.size * 0.75);
      this.baseLine.sub(c);
      this.endLine.add(c);
      this.dirLine = this.endLine.copy().sub(this.baseLine);
    }

    // Check if can be removed of both nodes
    canRemove() {
      let excess =
        this.child.arists.length > 1 && this.father.arists.length > 1;  // if father and child have more arists

      // check arist
      let l = [];
      let a = this.father.check(l, this);
      if (excess && a.length == ammountNodes) {
        return true;
      }
      return false;
    }

    // Remove from both nodes
    remove() {
      this.child.removeArist(this);
      this.father.removeArist(this);
    }

    // Get the other node reference
    getNeighborNode(n) {
      if (n == this.child) {
        return this.father;
      } else {
        return this.child;
      }
    }

    update() {
      // Play note if the arist have active notes 
      if (this.activeNotes > 0 && !this.actived) {
        this.actived = true;
        this.interval = p.random(maxInterval, minInterval); // set interval of time
        this.activeTime = p.millis() + this.interval; // set time to stop animation and play next note

        this.pointColor = this.from.shapeColor
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

        // Active next node
        while (this.activeNotes > 0) {
          this.activeNotes--;
          this.getNeighborNode(this.from).activeNotes++;
        }
        this.from = undefined;
      }
    }

    draw() {
      // Connection
      p.stroke(255);
      p.strokeWeight(1);
      p.line(this.baseLine.x, this.baseLine.y, this.endLine.x, this.endLine.y);

      // Note ball
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

        let child = this.getNeighborNode(this.from);
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
          nodeWidth / 10 * s,
          nodeWidth / 10 * s
        );
      }
    }
  }

  class Slider {
    // Properties
    name
    type
    pos
    width
    height

    // Data
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
      this.value = p.map(0.5, 0, 1, mnv, mxv) // set middle value
    }

    draw() {
      // Bar
      p.noStroke()
      p.fill(200, 200, 200)
      p.rectMode(p.CORNER)
      p.rect(this.pos.x, this.pos.y + this.height / 4, this.width, this.height / 2, 10)

      // Slider
      p.fill(255)
      p.ellipseMode(p.CENTER)
      let sliderPosX = p.map(this.value, this.minv, this.maxv, this.pos.x, this.pos.x + this.width)
      sliderPosX = p.min(this.pos.x + this.width, p.max(sliderPosX, this.pos.x))
      p.ellipse(sliderPosX, this.pos.y + this.height / 2, this.height, this.height)

      // Text
      p.fill(255)
      p.textSize(14)
      p.textAlign(p.CENTER, p.TOP)
      p.text(this.name + " (" + p.nfc(this.value, this.type == "Integer" ? 0 : 2) + ")", this.pos.x + this.width / 2, this.pos.y - 15)
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
};

let p5Instance = new p5(sketch)
