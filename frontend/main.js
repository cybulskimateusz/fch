class Main {
    socket = io()
    container = document.getElementById('main')
    app = new PIXI.Application({
        width: 300,
        height: 300,
        transparent: true,
        resizeTo: this.container,
        autoDensity: true,
        resolution: devicePixelRatio,
    })
    gradientTexture = PIXI.Texture.from("sprites/gradient.png")
    clickInteractions = new PIXI.ParticleContainer(10000, {
        scale: true,
        position: true,
        rotation: true,
        uvs: true
    })
    statisticsContainer = new PIXI.Container()

    guiProperties = {
        pointSize: 1.0,
        distance: 100,
        maxVotes: 5,
    }
    points = []

    constructor() {
        // BE
        const params = (new URL(document.location)).searchParams;

        this.channelID = params.get("channel") ||
            params.get("channelId") ||
            params.get("channelID") ||
            97032862;
        const heat = new Heat(this.channelID);
        heat.addEventListener('click', (e) => {
            this.drawClick(e.detail.x, e.detail.y);
        });
        this.handleSockets()

        // FE
        this.container.appendChild(this.app.view)
        this.createTexture()
        this.setupClickInteractions()
        this.addEventListeners()
        // this.createGui()
        this.setupStatistics()

        this.app.ticker.add(this.renderLoop)
    }

    handleSockets = () => {
        this.socket.on('reset', (id) => {
            if (id === this.channelID) this.reset()
        })
        this.socket.on('results', (id) => {
            if (id === this.channelID) this.showResults()
        })
    }

    createTexture() {
        let width = this.app.renderer.width;
        let height = this.app.renderer.height;
        this.renderTexture = PIXI.RenderTexture.create(width, height, PIXI.SCALE_MODES.LINEAR, devicePixelRatio);
        this.renderTextureSprite = new PIXI.Sprite(this.renderTexture);
        this.app.stage.addChild(this.renderTextureSprite)
        this.loadShader()
    }

    loadShader() {
        const fragmentShader = document.getElementById("fragment").innerHTML
        const simpleShader = new PIXI.Filter(null, fragmentShader);
        simpleShader.uniforms.gradient = this.gradientTexture;
        this.renderTextureSprite.filters = [simpleShader]
    }

    setupClickInteractions() {
        this.clickInteractions.blendMode = PIXI.BLEND_MODES.SCREEN;
        this.app.stage.addChild(this.clickInteractions)
    }

    setupStatistics = () => {
        this.statsFrame = new PIXI.Graphics();
        this.app.stage.addChild(this.statsFrame);
        let mask = new PIXI.Graphics();
        this.statisticsContainer.addChild(mask);
        this.statsFrame.addChild(this.statisticsContainer);
    }

    createGui() {
        this.gui = new dat.GUI()
        this.gui.add(this, 'showResults')
        this.gui
            .add(this.guiProperties, 'pointSize', 0, 2)
            .listen()
        this.gui
            .add(this.guiProperties, 'distance', 0, 1000)
            .onChange(this.onDistanceChange)
            .listen()
        this.gui
            .add(this.guiProperties, 'maxVotes', 0, 100)
            .listen()
    }

    onDistanceChange = (val) => {
        const screenX = parseInt(this.container.clientWidth / 2);
        const screenY = parseInt(this.container.clientHeight / 2);
        const gr  = new PIXI.Graphics();
        gr.beginFill(0xffffff);
        gr.drawCircle(screenX, screenY, val);
        gr.endFill();
        this.app.stage.addChild(gr)
        setTimeout(() => {this.app.stage.removeChild(gr)}, 100)
    }

    renderLoop = () => {
        for (let i = this.clickInteractions.children.length - 1; i >= 0; i--) {
            let child = this.clickInteractions.getChildAt(i);

            let age = (Date.now() - child.birth) / (child.death - child.birth);

            if (age >= 1) {
                child.destroy();
            } else {
                let scale = (1 - age) * this.guiProperties.pointSize;
                child.scale.set(scale);
            }
        };

        this.renderTexture.baseTexture.clearColor = [0, 0, 0, 1];
        this.app.renderer.render(this.clickInteractions, this.renderTexture, true);
    }

    drawClick(clickX, clickY) {
        const screenX = parseInt(clickX * this.container.clientWidth);
        const screenY = parseInt(clickY * this.container.clientHeight);
        const particle = PIXI.Sprite.from('sprites/particle.png');

        particle.anchor.set(0.5);
        particle.x = screenX;
        particle.y = screenY;
        particle.alpha = .2;

        this.points.push([screenX, screenY]);

        particle.birth = Date.now();
        particle.death = particle.birth + 10 * 1000;

        this.clickInteractions.addChild(particle);
    }

    reset = () => {
        this.statisticsContainer.removeChildren(0)
        this.points = []
    }

    showResults = () => {
        this.statisticsContainer.removeChildren(0)
        const { groups } = PointsCounter.groupPoints(this.points, this.guiProperties.distance)
        const averagePoints = PointsCounter.getClickStatistics(groups, this.guiProperties.maxVotes)
        averagePoints.forEach(this.drawStatistics)
        this.points = []
    }

    drawStatistics = ({ point, votes }) => {
        const text = new PIXI.Text(votes, {
            fontSize: 34,
            fill: 0x00ff00,
            wordWrap: true,
            wordWrapWidth: 180
        });
        text.anchor.set(0.5)
        text.x = parseInt(point[0])
        text.y = parseInt(point[1])

        this.statisticsContainer.addChild(text)
    }

    onClick = e => {
        const normalizedX = (e.clientX * 1.0 / window.innerWidth).toPrecision(3);
        const normalizedY = (e.clientY * 1.0 / window.innerHeight).toPrecision(3);
        this.drawClick(normalizedX, normalizedY);
    }

    onResize = () => {
        this.renderTextureSprite.width = this.app.renderer.width;
        this.renderTextureSprite.height = this.app.renderer.height;
        this.renderTexture.resize(this.app.renderer.width, this.app.renderer.height, true);
    }

    addEventListeners = () => {
        window.addEventListener('click', this.onClick)
        window.addEventListener('resize', this.onResize)
    }
}

new Main()
