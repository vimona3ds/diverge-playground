import * as THREE from 'three';

// Create scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
camera.position.z = 1;

const resolution = 1 / 8;
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#canvas'),
    antialias: false
});

// Create a plane that fills the screen
const geometry = new THREE.PlaneGeometry(2, 2);
const baseSpeed = 0.001;

const balls = [];

for (let i = 0; i < 12; i++) {
    const angle = Math.random() * 2 * Math.PI;
    balls.push({
        position: new THREE.Vector2(
            Math.random() * 2 - 1, // Random x between -1 and 1
            Math.random() * 2 - 1  // Random y between -1 and 1
        ),
        angle: angle,
        velocity: new THREE.Vector2(baseSpeed * Math.cos(angle), baseSpeed * Math.sin(angle)),
        radius: Math.random() * 0.25 + 0.05 // Random radius between 0.05 and 0.3
    });
}

// Define vertex and fragment shaders
const vertexShader = `
    void main() {
        gl_Position = vec4(position, 1.0);
    }
`;



const fragmentShader = `
    #define COLOR_DEPTH 2.
    #define BALLS ${balls.length}
    #define THRESHOLD ${balls.length - 7}.

    uniform float time;
    uniform vec2 resolution;

    uniform vec2 ballPositions[BALLS];
    uniform float ballRadii[BALLS];

    const int bayerMatrix[64] = int[64](
        0, 32, 8, 40, 2, 34, 10, 42,
        48, 16, 56, 24, 50, 18, 58, 26,
        12, 44, 4, 36, 14, 46, 6, 38,
        60, 28, 52, 20, 62, 30, 54, 22,
        3, 35, 11, 43, 1, 33, 9, 41,
        51, 19, 59, 27, 49, 17, 57, 25,
        15, 47, 7, 39, 13, 45, 5, 37,
        63, 31, 55, 23, 61, 29, 53, 21
    );

      float getBayerThreshold(vec2 pixelCoord) {
    int x = int(mod(pixelCoord.x, 8.0));
    int y = int(mod(pixelCoord.y, 8.0));
    int index = y * 8 + x;
    return float(bayerMatrix[index]) / 64.0;
  }

    vec3 dither(vec3 color, vec2 pixelCoord) {
    // Get threshold from Bayer matrix
    float threshold = getBayerThreshold(pixelCoord);
    
    // Calculate the number of color levels based on bit depth
    float levels = pow(2.0, COLOR_DEPTH) - 1.0;
    
    // Apply dithering to each color channel
    vec3 result;
    result.r = floor(color.r * levels + threshold) / levels;
    result.g = floor(color.g * levels + threshold) / levels;
    result.b = floor(color.b * levels + threshold) / levels;
    
    return result;
  }


    void main() {
        vec2 uv = -1. + 2. *gl_FragCoord.xy / resolution.xy;
        uv.x *= resolution.x / resolution.y;

        float sum = 0.;

        for (int i = 0; i < BALLS; i++) {
            vec2 ballPosition = ballPositions[i];
            float ballRadius = ballRadii[i];

            float distance = length(uv - ballPosition);

            sum += ballRadius / distance;
        }

        float threshold = smoothstep(THRESHOLD, THRESHOLD - 1., sum);
        vec2 pixelCoord = gl_FragCoord.xy;
        vec3 ditheredColor = dither(vec3(threshold, threshold, threshold), pixelCoord);

        gl_FragColor = vec4(ditheredColor, 1.);
    }
`;

// Create shader material
const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        ballPositions: { value: balls.map(ball => ball.position) },
        ballRadii: { value: balls.map(ball => ball.radius) },
    },
});

function handleResize() {
    renderer.setSize(window.innerWidth * resolution, window.innerHeight * resolution, false);
    material.uniforms.resolution.value.x = window.innerWidth * resolution;
    material.uniforms.resolution.value.y = window.innerHeight * resolution;
}

handleResize();

// Handle window resizing
window.addEventListener('resize', handleResize);

// Create mesh with geometry and material
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update time uniform
    material.uniforms.time.value += 0.01;

    // Update ball positions based on velocity, then update velocity based on sine waves
    balls.forEach(ball => {
        ball.position.x += ball.velocity.x;
        ball.position.y += ball.velocity.y;

        if (ball.position.x < -1 || ball.position.x > 1) {
            ball.velocity.x *= -1;
        }
        if (ball.position.y < -1 || ball.position.y > 1) {
            ball.velocity.y *= -1;
        }

        balls.forEach(otherBall => {
            if (ball === otherBall) return;

            const dx = otherBall.position.x - ball.position.x;
            const dy = otherBall.position.y - ball.position.y;
            // const distance = ball.position.distanceTo(otherBall.position);
            const distance = Math.hypot(dx, dy);

            ball.velocity.x += dx / (200000 * distance ** 0.5);
            ball.velocity.y += dy / (200000 * distance ** 0.5);

            const s = Math.hypot(ball.velocity.x, ball.velocity.y);
            const f = Math.pow(2, -1 * Math.pow(s, 2) / 500000);

            ball.velocity.x *= f;
            ball.velocity.y *= f;
        });
    });

    renderer.render(scene, camera);
}
animate(); 