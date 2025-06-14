// AimBow Physics Simulator - First Person Enhanced with Accurate Trajectory Prediction
// Minecraft 1.8.9 projectile physics simulation

class MinecraftMath {
    static sin(degrees) {
        return Math.sin(degrees / 180.0 * Math.PI);
    }
    
    static cos(degrees) {
        return Math.cos(degrees / 180.0 * Math.PI);
    }
    
    static sqrt_double(value) {
        return Math.sqrt(value);
    }
    
    static atan2(y, x) {
        return Math.atan2(y, x) * 180.0 / Math.PI;
    }
}

class ProjectileType {
    constructor(name, gravity, velocity, inaccuracy, displayName, color, size = 0.1) {
        this.name = name;
        this.gravity = gravity;
        this.velocity = velocity;
        this.inaccuracy = inaccuracy;
        this.displayName = displayName;
        this.color = color;
        this.size = size;
    }
}

class RayData {
    constructor(projectileType, force = 1.0) {
        this.projectileType = projectileType;
        this.force = force;
        this.posX = 0;
        this.posY = 0;
        this.posZ = 0;
        this.motionX = 0;
        this.motionY = 0;
        this.motionZ = 0;
        this.rotationYaw = 0;
        this.rotationPitch = 0;
        this.prevRotationYaw = 0;
        this.prevRotationPitch = 0;
        this.dead = false;
        this.trajectory = [];
        this.tickCount = 0;
        this.USE_RANDOM = false;
    }
    
    setLocationAndAngles(posX, posY, posZ, rotationYaw, rotationPitch) {
        this.rotationYaw = rotationYaw;
        this.rotationPitch = rotationPitch;
        this.setPosition(posX, posY, posZ);
    }
    
    setPosition(x, y, z) {
        this.posX = x;
        this.posY = y;
        this.posZ = z;
    }
    
    shootFromTowards(shootingPos, lookVec) {
        const yaw = MinecraftMath.atan2(lookVec.z, lookVec.x) - 90.0;
        const pitch = -MinecraftMath.atan2(lookVec.y, 
            Math.sqrt(lookVec.x * lookVec.x + lookVec.z * lookVec.z));
        
        this.setLocationAndAngles(
            shootingPos.x, 
            shootingPos.y,
            shootingPos.z,
            yaw, 
            pitch
        );
        this.shoot();
    }
    
    shoot() {
        if (this.projectileType.name === 'bow') {
            this.shootBow();
        } else {
            this.shootThrowable();
        }
    }
    
    shootBow() {
        this.posX -= MinecraftMath.cos(this.rotationYaw) * 0.16;
        this.posY -= 0.10000000149011612;
        this.posZ -= MinecraftMath.sin(this.rotationYaw) * 0.16;
        this.setPosition(this.posX, this.posY, this.posZ);
        
        const motionX = -MinecraftMath.sin(this.rotationYaw) * MinecraftMath.cos(this.rotationPitch);
        const motionZ = MinecraftMath.cos(this.rotationYaw) * MinecraftMath.cos(this.rotationPitch);
        const motionY = -MinecraftMath.sin(this.rotationPitch);
        
        this.setThrowableHeading(motionX, motionY, motionZ, this.force * 1.5, 
            this.USE_RANDOM ? 1.0 : 0);
    }
    
    shootThrowable() {
        this.posX -= MinecraftMath.cos(this.rotationYaw) * 0.16;
        this.posY -= 0.10000000149011612;
        this.posZ -= MinecraftMath.sin(this.rotationYaw) * 0.16;
        this.setPosition(this.posX, this.posY, this.posZ);
        
        const f = 0.4;
        const motionX = -MinecraftMath.sin(this.rotationYaw) * MinecraftMath.cos(this.rotationPitch) * f;
        const motionZ = MinecraftMath.cos(this.rotationYaw) * MinecraftMath.cos(this.rotationPitch) * f;
        const motionY = -MinecraftMath.sin(this.rotationPitch + this.projectileType.inaccuracy) * f;
        
        this.setThrowableHeading(motionX, motionY, motionZ, this.projectileType.velocity, 
            this.USE_RANDOM ? 1.0 : 0);
    }
    
    setThrowableHeading(motionX, motionY, motionZ, force, randomInfluence) {
        let f2 = MinecraftMath.sqrt_double(motionX * motionX + motionY * motionY + motionZ * motionZ);
        motionX /= f2;
        motionY /= f2;
        motionZ /= f2;
        
        if (randomInfluence > 0) {
            motionX += (Math.random() * 2 - 1) * 0.007499999832361937 * randomInfluence;
            motionY += (Math.random() * 2 - 1) * 0.007499999832361937 * randomInfluence;
            motionZ += (Math.random() * 2 - 1) * 0.007499999832361937 * randomInfluence;
        }
        
        motionX *= force;
        motionY *= force;
        motionZ *= force;
        
        this.motionX = motionX;
        this.motionY = motionY;
        this.motionZ = motionZ;
        
        const f3 = MinecraftMath.sqrt_double(motionX * motionX + motionZ * motionZ);
        this.prevRotationYaw = this.rotationYaw = MinecraftMath.atan2(motionX, motionZ);
        this.prevRotationPitch = this.rotationPitch = MinecraftMath.atan2(motionY, f3);
    }
    
    moveTick() {
        this.tickCount++;
        
        const f2 = MinecraftMath.sqrt_double(this.motionX * this.motionX + this.motionZ * this.motionZ);
        this.rotationYaw = MinecraftMath.atan2(this.motionX, this.motionZ);
        
        while (this.rotationPitch - this.prevRotationPitch < -180.0) {
            this.prevRotationPitch -= 360.0;
        }
        while (this.rotationPitch - this.prevRotationPitch >= 180.0) {
            this.prevRotationPitch += 360.0;
        }
        while (this.rotationYaw - this.prevRotationYaw < -180.0) {
            this.prevRotationYaw -= 360.0;
        }
        while (this.rotationYaw - this.prevRotationYaw >= 180.0) {
            this.prevRotationYaw += 360.0;
        }
        
        this.rotationPitch = this.prevRotationPitch + (this.rotationPitch - this.prevRotationPitch) * 0.2;
        this.rotationYaw = this.prevRotationYaw + (this.rotationYaw - this.prevRotationYaw) * 0.2;
        
        const f3 = 0.99;
        const f1 = this.projectileType.gravity;
        
        this.motionX *= f3;
        this.motionY *= f3;
        this.motionZ *= f3;
        this.motionY -= f1;
        
        this.setPosition(this.posX + this.motionX, this.posY + this.motionY, this.posZ + this.motionZ);
        
        this.trajectory.push(new THREE.Vector3(this.posX, this.posY, this.posZ));
        
        if (this.posY <= 0) {
            this.dead = true;
        }
        
        if (this.trajectory.length > 300) {
            this.dead = true;
        }
    }
    
    simulateFullTrajectory() {
        while (!this.dead) {
            this.moveTick();
        }
        return this.trajectory;
    }
}

class ReverseBowSolver {
    constructor(gravity, velocity) {
        this.gravity = gravity;
        this.velocity = velocity;
        this.MAX_STEPS = 120;
    }
    
    getLookForTarget(targetPos, playerPos) {
        const dx = targetPos.x - playerPos.x;
        const dz = targetPos.z - playerPos.z;
        const dHor = Math.sqrt(dx * dx + dz * dz);
        const dVert = targetPos.y - (playerPos.y);
        
        const y = this.getYForTarget(dHor, dVert);
        if (isNaN(y)) return null;
        
        const xz = Math.sqrt(1 - y * y);
        const x = dx / dHor * xz;
        const z = dz / dHor * xz;
        
        return new THREE.Vector3(x, y, z);
    }
    
    getYForTarget(dHor, dVert) {
        let maxVert = 0.9, minVert = -0.9;
        
        for (let attempts = 0; attempts < 50; attempts++) {
            const vert = (maxVert + minVert) / 2;
            const hor = Math.sqrt(1 - vert * vert);
            const newY = this.getYAtDistance(hor * this.velocity, vert * this.velocity, dHor);
            
            if (isNaN(newY)) {
                return 0;
            } else if (newY > dVert) {
                maxVert = vert;
            } else {
                minVert = vert;
            }
        }
        
        return (maxVert + minVert) / 2;
    }
    
    getYAtDistance(motionX, motionY, dHor) {
        const f3 = 0.99;
        const f1 = this.gravity;
        let posX = 0, posY = 0;
        
        for (let i = 0; i < this.MAX_STEPS; i++) {
            if (posX + motionX >= dHor) {
                const step = (dHor - posX) / motionX;
                return posY + step * motionY;
            }
            
            posX += motionX;
            posY += motionY;
            
            motionX *= f3;
            motionY *= f3;
            motionY -= f1;
        }
        return posY;
    }
}

class AnimatedProjectile {
    constructor(scene, projectileType, trajectory) {
        this.scene = scene;
        this.projectileType = projectileType;
        this.trajectory = trajectory;
        this.currentIndex = 0;
        this.mesh = this.createProjectileMesh();
        this.scene.add(this.mesh);
    }
    
    createProjectileMesh() {
        let geometry, material;
        
        switch(this.projectileType.name) {
            case 'bow':
                // Arrow
                geometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
                material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                break;
            case 'throwable':
                // Snowball
                geometry = new THREE.SphereGeometry(0.08, 8, 8);
                material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
                break;
            case 'potion':
                // Potion bottle
                geometry = new THREE.CylinderGeometry(0.06, 0.08, 0.12, 8);
                material = new THREE.MeshLambertMaterial({ color: 0x9b59b6 });
                break;
            case 'enderpearl':
                // Ender pearl
                geometry = new THREE.SphereGeometry(0.06, 8, 8);
                material = new THREE.MeshLambertMaterial({ color: 0x16a085 });
                break;
            case 'fishing':
                // Fishing hook
                geometry = new THREE.SphereGeometry(0.04, 6, 6);
                material = new THREE.MeshLambertMaterial({ color: 0x666666 });
                break;
            default:
                geometry = new THREE.SphereGeometry(0.05, 6, 6);
                material = new THREE.MeshLambertMaterial({ color: this.projectileType.color });
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        return mesh;
    }
    
    update() {
        if (this.currentIndex >= this.trajectory.length - 1) {
            this.scene.remove(this.mesh);
            return false; // Animation finished
        }
        
        const currentPos = this.trajectory[this.currentIndex];
        const nextPos = this.trajectory[this.currentIndex + 1];
        
        this.mesh.position.copy(currentPos);
        
        // Orient arrow in direction of movement
        if (this.projectileType.name === 'bow' && nextPos) {
            const direction = new THREE.Vector3().subVectors(nextPos, currentPos).normalize();
            this.mesh.lookAt(currentPos.clone().add(direction));
            this.mesh.rotateX(Math.PI / 2); // Align arrow tip forward
        }
        
        this.currentIndex += 2; // Speed up animation
        return true; // Continue animation
    }
}

class MinecraftModels {
    static createPig() {
        const pig = new THREE.Group();
        
        // Pig body
        const bodyGeometry = new THREE.BoxGeometry(0.9, 0.6, 1.4);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFC0CB }); // Pink
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(0, 0.3, 0);
        body.castShadow = true;
        pig.add(body);
        
        // Pig head
        const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.set(0, 0.3, 0.8);
        head.castShadow = true;
        pig.add(head);
        
        // Pig snout
        const snoutGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
        const snoutMaterial = new THREE.MeshLambertMaterial({ color: 0xFF69B4 });
        const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
        snout.position.set(0, 0.3, 1.15);
        snout.castShadow = true;
        pig.add(snout);
        
        // Pig legs
        const legGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0xFFC0CB });
        
        const legs = [];
        const legPositions = [
            [-0.25, -0.3, 0.4],
            [0.25, -0.3, 0.4],
            [-0.25, -0.3, -0.4],
            [0.25, -0.3, -0.4]
        ];
        
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            pig.add(leg);
            legs.push(leg);
        });
        
        // Pig tail
        const tailGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.2);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(0, 0.5, -0.8);
        tail.castShadow = true;
        pig.add(tail);
        
        pig.userData = { body, head, snout, legs, tail };
        return pig;
    }
    
    static createFirstPersonItem(itemType) {
        let geometry, material;
        
        switch(itemType) {
            case 'bow':
                // Bow visible in first person
                geometry = new THREE.BoxGeometry(0.05, 1.2, 0.05);
                material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                break;
            case 'throwable':
                geometry = new THREE.SphereGeometry(0.1, 8, 8);
                material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
                break;
            case 'potion':
                geometry = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 8);
                material = new THREE.MeshLambertMaterial({ color: 0x9b59b6 });
                break;
            case 'enderpearl':
                geometry = new THREE.SphereGeometry(0.08, 8, 8);
                material = new THREE.MeshLambertMaterial({ color: 0x16a085 });
                break;
            case 'fishing':
                geometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
                material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                break;
            default:
                geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
                material = new THREE.MeshLambertMaterial({ color: 0x666666 });
        }
        
        const item = new THREE.Mesh(geometry, material);
        return item;
    }
}

class AimBowSimulator {
    constructor() {
        // Initialize everything in the correct order
        this.trajectories = [];
        this.animatedProjectiles = [];
        this.targetLocked = false;
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.playerPosition = new THREE.Vector3(0, 1.62, 0); // Eye height - INITIALIZE FIRST
        this.predictionTrajectory = null; // For real-time prediction
        
        this.stats = {
            fps: 0,
            frameCount: 0,
            lastFpsUpdate: Date.now()
        };
        
        // Now initialize other components
        this.initProjectileTypes();
        this.initControls();
        this.initThreeJS();
        this.initGUI();
        this.setupEventListeners();
        
        this.reverseSolver = new ReverseBowSolver(0.05, 3.0);
        
        this.animate();
    }
    
    initProjectileTypes() {
        this.projectileTypes = {
            bow: new ProjectileType('bow', 0.05, 1.5, 0, 'Bow & Arrow', 0x00ff88, 0.1),
            throwable: new ProjectileType('throwable', 0.03, 1.5, 0, 'Snowball/Egg', 0xff6b6b, 0.08),
            potion: new ProjectileType('potion', 0.05, 1.5, -20, 'Splash Potion', 0x9b59b6, 0.08),
            enderpearl: new ProjectileType('enderpearl', 0.03, 1.5, 0, 'Ender Pearl', 0x16a085, 0.06),
            fishing: new ProjectileType('fishing', 0.04, 1.25, 0, 'Fishing Rod', 0xf39c12, 0.04)
        };
        
        this.currentProjectileType = this.projectileTypes.bow;
    }
    
    initControls() {
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            fire: false,
            turnLeft: false,
            turnRight: false,
            lookUp: false,
            lookDown: false,
            playerYaw: 0,
            playerPitch: 0,
            playerVelocityY: 0,
            isOnGround: true,
            mouseLocked: false
        };
    }
    
    initThreeJS() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 300);
        
        // First-person camera setup
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.copy(this.playerPosition);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
        
        // Ground (grass-like)
        const groundGeometry = new THREE.PlaneGeometry(400, 400);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x90EE90
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        
        // Grid
        const gridHelper = new THREE.GridHelper(400, 80, 0x228B22, 0x32CD32);
        this.scene.add(gridHelper);
        
        // Create pig target
        this.target = MinecraftModels.createPig();
        this.target.position.set(20, 0, 0);
        this.scene.add(this.target);
        
        // Target marker
        const markerGeometry = new THREE.ConeGeometry(0.3, 2, 8);
        const markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff4757 });
        this.targetMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        this.targetMarker.position.set(20, 3, 0);
        this.scene.add(this.targetMarker);
        
        // First-person item in hand
        this.currentItem = MinecraftModels.createFirstPersonItem(this.currentProjectileType.name);
        this.setupFirstPersonItem();
    }
    
    initGUI() {
        this.updateProjectileTypeDisplay();
    }
    
    setupFirstPersonItem() {
        // Remove old item
        if (this.currentItem && this.currentItem.parent) {
            this.currentItem.parent.remove(this.currentItem);
        }
        
        // Create new item for first person view
        this.currentItem = MinecraftModels.createFirstPersonItem(this.currentProjectileType.name);
        
        // Position item in first person view (bottom right of screen)
        this.currentItem.position.set(0.8, -0.8, -1.5);
        this.currentItem.rotation.set(0.2, 0.3, 0);
        
        // Add to camera so it moves with view
        this.camera.add(this.currentItem);
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse events for pointer lock
        this.renderer.domElement.addEventListener('click', () => {
            this.renderer.domElement.requestPointerLock();
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.controls.mouseLocked = document.pointerLockElement === this.renderer.domElement;
        });
        
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Projectile type buttons
        document.querySelectorAll('.projectile-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.setProjectileType(type);
            });
        });
    }
    
    onKeyDown(event) {
        switch(event.code) {
            case 'KeyW':
                this.controls.forward = true;
                break;
            case 'KeyS':
                this.controls.backward = true;
                break;
            case 'KeyA':
                this.controls.left = true;
                break;
            case 'KeyD':
                this.controls.right = true;
                break;
            case 'ArrowUp':
                this.controls.lookUp = true;
                break;
            case 'ArrowDown':
                this.controls.lookDown = true;
                break;
            case 'ArrowLeft':
                this.controls.turnLeft = true;
                break;
            case 'ArrowRight':
                this.controls.turnRight = true;
                break;
            case 'Space':
                this.controls.jump = true;
                event.preventDefault();
                break;
            case 'Enter':
                if (!this.isCharging) {
                    this.startCharging();
                }
                break;
            case 'KeyR':
                this.clearTrajectories();
                break;
            case 'KeyT':
                this.targetLocked = !this.targetLocked;
                break;
        }
    }
    
    onKeyUp(event) {
        switch(event.code) {
            case 'KeyW':
                this.controls.forward = false;
                break;
            case 'KeyS':
                this.controls.backward = false;
                break;
            case 'KeyA':
                this.controls.left = false;
                break;
            case 'KeyD':
                this.controls.right = false;
                break;
            case 'ArrowUp':
                this.controls.lookUp = false;
                break;
            case 'ArrowDown':
                this.controls.lookDown = false;
                break;
            case 'ArrowLeft':
                this.controls.turnLeft = false;
                break;
            case 'ArrowRight':
                this.controls.turnRight = false;
                break;
            case 'Space':
                this.controls.jump = false;
                break;
            case 'Enter':
                if (this.isCharging) {
                    this.fireProjectile();
                }
                break;
        }
    }
    
    onMouseMove(event) {
        if (this.controls.mouseLocked) {
            const sensitivity = 0.002;
            // Mouse X controls yaw (left/right rotation)
            this.controls.playerYaw -= event.movementX * sensitivity;
            // Mouse Y controls pitch (up/down look) - NO ROLL
            this.controls.playerPitch -= event.movementY * sensitivity;
            this.controls.playerPitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.controls.playerPitch));
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    startCharging() {
        this.isCharging = true;
        this.chargeStartTime = Date.now();
        
        // Animate charging (pull back bow)
        if (this.currentProjectileType.name === 'bow') {
            this.animateItemCharging();
        }
    }
    
    // Simplified trajectory calculation that matches exactly what we shoot
    calculateTrajectoryDirection() {
        let direction;
        if (this.targetLocked) {
            direction = this.reverseSolver.getLookForTarget(this.target.position, this.playerPosition);
            if (!direction) {
                direction = new THREE.Vector3()
                    .subVectors(this.target.position, this.playerPosition)
                    .normalize();
            }
        } else {
            // Use camera's look direction - EXACTLY what we use for shooting
            direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);
        }
        return direction;
    }
    
    fireProjectile() {
        if (!this.isCharging) return;
        
        const force = this.calculateBowForce();
        const rayData = new RayData(this.currentProjectileType, force);
        
        // Use exact same direction calculation as prediction
        const direction = this.calculateTrajectoryDirection();
        
        // Start projectile slightly above camera position (like shooting from hand)
        const shootingPos = new THREE.Vector3().copy(this.playerPosition);
        shootingPos.y += 0.2; // Slightly above eye level
        
        rayData.shootFromTowards(shootingPos, direction);
        const trajectory = rayData.simulateFullTrajectory();
        
        this.addTrajectoryToScene(trajectory, this.currentProjectileType.color);
        this.createAnimatedProjectile(trajectory);
        
        this.isCharging = false;
        this.resetItemPose();
    }
    
    calculateBowForce() {
        if (this.currentProjectileType.name !== 'bow') return 1.0;
        
        const chargeTime = Math.min((Date.now() - this.chargeStartTime) / 1000, 3.0);
        // Minecraft bow charging: 0.2s minimum, reaches full power at 1.0s
        if (chargeTime < 0.2) return 0.5;
        return Math.min(chargeTime, 1.0) * 2.5 + 0.5;
    }
    
    createAnimatedProjectile(trajectory) {
        const projectile = new AnimatedProjectile(this.scene, this.currentProjectileType, trajectory);
        this.animatedProjectiles.push(projectile);
    }
    
    updatePredictionTrajectory() {
        // Remove old prediction trajectory
        if (this.predictionTrajectory) {
            this.scene.remove(this.predictionTrajectory);
        }
        
        // Calculate current force for bow or default for other items
        let force = 1.0;
        if (this.currentProjectileType.name === 'bow') {
            if (this.isCharging) {
                force = this.calculateBowForce();
            } else {
                force = 1.0; // Default force when not charging
            }
        }
        
        const rayData = new RayData(this.currentProjectileType, force);
        
        // Use EXACT same direction calculation as firing
        const direction = this.calculateTrajectoryDirection();
        
        // Start prediction trajectory slightly above camera position - SAME as firing
        const shootingPos = new THREE.Vector3().copy(this.playerPosition);
        shootingPos.y += 0.2; // Slightly above eye level
        
        rayData.shootFromTowards(shootingPos, direction);
        const trajectory = rayData.simulateFullTrajectory();
        
        // Create prediction line (more transparent and different style)
        if (trajectory.length > 1) {
            const geometry = new THREE.BufferGeometry().setFromPoints(trajectory);
            const material = new THREE.LineBasicMaterial({ 
                color: this.currentProjectileType.color,
                transparent: true,
                opacity: 0.4,
                linewidth: 1
            });
            
            this.predictionTrajectory = new THREE.Line(geometry, material);
            this.scene.add(this.predictionTrajectory);
        }
    }
    
    updatePlayer() {
        const speed = 0.15;
        const lookSpeed = 0.03;
        
        // Handle movement
        const moveVector = new THREE.Vector3();
        if (this.controls.forward) moveVector.z -= speed;
        if (this.controls.backward) moveVector.z += speed;
        if (this.controls.left) moveVector.x -= speed;
        if (this.controls.right) moveVector.x += speed;
        
        // Apply movement relative to player rotation
        if (moveVector.length() > 0) {
            moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.controls.playerYaw);
            this.playerPosition.add(moveVector);
        }
        
        // Handle look controls with arrow keys (in addition to mouse)
        if (this.controls.turnLeft) this.controls.playerYaw += lookSpeed;
        if (this.controls.turnRight) this.controls.playerYaw -= lookSpeed;
        if (this.controls.lookUp) this.controls.playerPitch += lookSpeed;
        if (this.controls.lookDown) this.controls.playerPitch -= lookSpeed;
        
        // Clamp pitch
        this.controls.playerPitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.controls.playerPitch));
        
        // Jumping
        if (this.controls.jump && this.controls.isOnGround) {
            this.controls.playerVelocityY = 0.25;
            this.controls.isOnGround = false;
        }
        
        // Gravity
        this.controls.playerVelocityY -= 0.015;
        this.playerPosition.y += this.controls.playerVelocityY;
        
        // Ground collision
        if (this.playerPosition.y <= 1.62) {
            this.playerPosition.y = 1.62;
            this.controls.playerVelocityY = 0;
            this.controls.isOnGround = true;
        }
        
        // Update camera position and rotation - FIXED: Explicitly control all rotations
        this.camera.position.copy(this.playerPosition);
        
        // Create rotation manually to prevent any unwanted roll
        const euler = new THREE.Euler(
            this.controls.playerPitch, // X rotation (pitch)
            this.controls.playerYaw,   // Y rotation (yaw)
            0,                         // Z rotation (roll) - ALWAYS 0
            'YXZ'                      // Rotation order
        );
        this.camera.setRotationFromEuler(euler);
    }
    
    animateItemCharging() {
        if (this.currentProjectileType.name === 'bow') {
            const chargeTime = (Date.now() - this.chargeStartTime) / 1000;
            const progress = Math.min(chargeTime / 1.0, 1.0); // Full charge in 1 second
            
            // Pull bow back as it charges
            this.currentItem.position.x = 0.8 - progress * 0.3;
            this.currentItem.rotation.z = progress * 0.3;
            
            // Make bow string tighter (simulate by scaling)
            this.currentItem.scale.z = 1 - progress * 0.2;
        }
    }
    
    resetItemPose() {
        // Reset item to normal position
        this.currentItem.position.set(0.8, -0.8, -1.5);
        this.currentItem.rotation.set(0.2, 0.3, 0);
        this.currentItem.scale.set(1, 1, 1);
    }
    
    updateTargetMarker() {
        this.targetMarker.position.copy(this.target.position);
        this.targetMarker.position.y += 3;
        this.targetMarker.rotation.y += 0.02;
    }
    
    setProjectileType(typeName) {
        this.currentProjectileType = this.projectileTypes[typeName];
        this.updateProjectileTypeDisplay();
        this.setupFirstPersonItem();
        
        // Update solver for new projectile type
        if (typeName === 'bow') {
            this.reverseSolver = new ReverseBowSolver(0.05, 3.0);
        } else {
            this.reverseSolver = new ReverseBowSolver(
                this.currentProjectileType.gravity, 
                this.currentProjectileType.velocity
            );
        }
        
        // Update button states
        document.querySelectorAll('.projectile-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === typeName) {
                btn.classList.add('active');
            }
        });
    }
    
    updateProjectileTypeDisplay() {
        document.getElementById('currentProjectile').textContent = this.currentProjectileType.displayName;
        document.getElementById('currentGravity').textContent = this.currentProjectileType.gravity.toFixed(3);
        document.getElementById('currentVelocity').textContent = this.currentProjectileType.name === 'bow' ? 'Variable' : this.currentProjectileType.velocity.toFixed(1);
        document.getElementById('currentDrag').textContent = '0.99';
    }
    
    addTrajectoryToScene(trajectory, color) {
        if (trajectory.length < 2) return;
        
        const geometry = new THREE.BufferGeometry().setFromPoints(trajectory);
        const material = new THREE.LineBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8,
            linewidth: 3
        });
        
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        this.trajectories.push(line);
        
        // Limit number of trajectories
        if (this.trajectories.length > 5) {
            const oldTrajectory = this.trajectories.shift();
            this.scene.remove(oldTrajectory);
        }
    }
    
    clearTrajectories() {
        this.trajectories.forEach(trajectory => {
            this.scene.remove(trajectory);
        });
        this.trajectories = [];
        
        // Clear animated projectiles
        this.animatedProjectiles.forEach(projectile => {
            this.scene.remove(projectile.mesh);
        });
        this.animatedProjectiles = [];
        
        // Clear prediction trajectory
        if (this.predictionTrajectory) {
            this.scene.remove(this.predictionTrajectory);
            this.predictionTrajectory = null;
        }
    }
    
    updateAnimatedProjectiles() {
        this.animatedProjectiles = this.animatedProjectiles.filter(projectile => {
            return projectile.update();
        });
    }
    
    updateStats() {
        this.stats.frameCount++;
        const now = Date.now();
        
        if (now - this.stats.lastFpsUpdate >= 1000) {
            this.stats.fps = this.stats.frameCount;
            this.stats.frameCount = 0;
            this.stats.lastFpsUpdate = now;
            
            // Update UI
            document.getElementById('fps').textContent = this.stats.fps;
            document.getElementById('trajectoryCount').textContent = this.trajectories.length;
            document.getElementById('projectileCount').textContent = this.animatedProjectiles.length;
            
            if (this.isCharging && this.currentProjectileType.name === 'bow') {
                const chargeTime = (Date.now() - this.chargeStartTime) / 1000;
                document.getElementById('drawTime').textContent = Math.min(chargeTime, 3.0).toFixed(2) + 's';
                document.getElementById('bowForce').textContent = this.calculateBowForce().toFixed(2);
            } else {
                document.getElementById('drawTime').textContent = '0.0s';
                document.getElementById('bowForce').textContent = this.currentProjectileType.name === 'bow' ? '1.0' : '1.0';
            }
            
            const distance = this.playerPosition.distanceTo(this.target.position);
            document.getElementById('targetDistance').textContent = distance.toFixed(1) + 'm';
            
            // Calculate optimal angle if bow is selected
            if (this.currentProjectileType.name === 'bow') {
                const optimalLook = this.reverseSolver.getLookForTarget(this.target.position, this.playerPosition);
                if (optimalLook) {
                    const angle = Math.asin(-optimalLook.y) * 180 / Math.PI;
                    document.getElementById('optimalAngle').textContent = angle.toFixed(1) + '°';
                } else {
                    document.getElementById('optimalAngle').textContent = 'N/A';
                }
            } else {
                document.getElementById('optimalAngle').textContent = 'N/A';
            }
            
            // Update position display
            document.getElementById('playerX').textContent = this.playerPosition.x.toFixed(1);
            document.getElementById('playerY').textContent = (this.playerPosition.y - 1.62).toFixed(1);
            document.getElementById('playerZ').textContent = this.playerPosition.z.toFixed(1);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updatePlayer();
        this.updateTargetMarker();
        this.updateAnimatedProjectiles();
        this.updatePredictionTrajectory(); // Update prediction every frame
        this.updateStats();
        
        // Animate charging item
        if (this.isCharging) {
            this.animateItemCharging();
        }
        
        // Animate pig (simple bobbing)
        this.target.userData.body.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the simulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.aimBowSimulator = new AimBowSimulator();
});