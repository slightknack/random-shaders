// hello fellow chad randy
// I am shader god isaac, at your service
// this is a ground shader, modeled after you pixel art
// I threw it togeth in a couple hours after watching your video today
// It's not particularly optimized,
// but it used a variety of techniques you may find useful.

// copsta-and-pasta into:
// http://editor.thebookofshaders.com/
// to run.

// There are a few things that can be improved,
// but they mainly revolve around better paramaterization,
// more consistent coordinate spaces,
// and so on.

// Title: The Ground

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

// quick hack for random numbers
vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

// gridded voroni tiling
// same thing you can find in the book of shaders
// return: x is id, y is distance, z is angle
vec3 voroni(in vec2 st, in float scale) {    
    // Tile the space
    vec2 i_st = floor(st / scale);
    vec2 f_st = fract(st / scale);

    float m_dist = 1.; // minimum distance
    vec2  m_point;     // minimum point
    float m_dot;       // minimum dot, measure of similarity

    for (int j=-1; j<=1; j++ ) {
        for (int i=-1; i<=1; i++ ) {
            vec2 neighbor = vec2(float(i),float(j));
            vec2 point = random2(i_st + neighbor);
            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);

            if(dist < m_dist) {
                m_dist  = dist;
                m_point = point;
                m_dot   = dot(normalize(diff), -vec2(0.0, 1.0)) * 0.5 + 0.5;
            }
        }
    }

    // give each tile a random unique id between 0 and 1
    float id = random2(m_point).x;
    return vec3(id, m_dist, m_dot);
}

// converts a pixel into an aspect-ratio scaled point centered around the origin
vec2 pixel_to_point(in vec2 pixel) {
    vec2 st = 2.0 * pixel/u_resolution.xy - 1.0;
    st.x *= u_resolution.x/u_resolution.y;
    return st;
}

#define PIXEL_SIZE (1.0 / u_resolution.y)

// rotation for lighting angles
mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

// calculates the edges between cells by sampling vertically and horizontally, then checking the ids
// return: x is edge, y is distance, z is angle
vec3 edge(in vec2 pixel, in float thickness, float angle, float scale) {
    mat2 rotation = rotate2d(angle);
    vec2 u = pixel_to_point(pixel + vec2(0.0, -thickness) * rotation);
    vec2 l = pixel_to_point(pixel + vec2(thickness, 0.0) * rotation);
    vec2 m = pixel_to_point(pixel);
    
    float u_id = voroni(u, PIXEL_SIZE * scale).x;
    float l_id = voroni(l, PIXEL_SIZE * scale).x;
    vec3  m_vo = voroni(m, PIXEL_SIZE * scale);
    
    float e = 1.0 - float(u_id == m_vo.x && l_id == m_vo.x);
    return vec3(e, m_vo.y, m_vo.z);
}

// from memory lol
#define PI 3.14159265358979323846264338327950288417

// a composition pass that samples the voroni noise at multiple places
// to calculate some thicc edges to get nice lighting
// r is edge, g is lighting, b is distance, z is angle
vec4 lighting(in vec2 pixel, in float intensity, in float angle) {
    vec3 e = edge(pixel, 1.5, 0.0, 12.0);
    vec3 e3 = edge(pixel, intensity, angle, 12.0);
    
    return vec4(e.x, e3.x, e.y, e.z);
}

// we're just using a sine wave as the ground for now
float ground(in vec2 point) {
    point *= vec2(7.0, 11.0);
    return sin(point.x) - point.y + 5.;
}

float sigmoid(in float x) {
    return 1.0 / (1.0 + pow(2.72, -x));
}

#define BLACK vec3(0.05, 0.0, 0.02)
#define BROWN vec3(0.0)
#define TOP   vec3(0.5, 0.3, 0.2)

// number of color bands
// this snaps it to 8.
// I imagine you have your own pallete and so on
#define STEPS 8.0
#define STEP  1.0 / STEPS

// Noise to break up banding

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random2(i).x;
    float b = random2(i + vec2(1.0, 0.0)).x;
    float c = random2(i + vec2(0.0, 1.0)).x;
    float d = random2(i + vec2(1.0, 1.0)).x;

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

// fractional brownian motion

#define OCTAVES 3
float fbm (in vec2 st) {
    // Initial values
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    //
    // Loop of octaves
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

// given a number between 0 and 1,
// return the corresponding color in the pallete gradient
vec3 color_curve(in float x) {
    x = min(max(x, 0.0), 1.0);
    x = floor(x * STEPS) / STEPS;
    vec3 color = TOP * x + BLACK * (1.0 - x);
    return color;
}

void main() {
    // calculate coordinates
    vec2 pixel = gl_FragCoord.xy;
    pixel += random2(pixel) * 1.5;
    vec2 point = pixel_to_point(pixel);
        
    // get the dirt info
    vec4 dirt = lighting(pixel, 1.3, PI);
    
    // base colors
    float tone = 0.0 * u_time;
    // the outline
    tone += 1.0 * STEP * dirt.r;
    // the lighting
    tone += 3.0 * STEP * (1.0 - dirt.g) * (1.0 - dirt.r);
    // the rock fill
    tone += 5.0 * STEP * dirt.g * (1.0 - dirt.r);
        
    // calculate ground depth:
    float depth = ground(point);
    
    // return early if sky
    // this is a checker pattern
    // but you could set it to transparent or something for compositing
    if (depth < 0.0) {
        vec2 unpixel = gl_FragCoord.xy;
        float checker = ceil(sin(unpixel.x * 0.1) * sin(unpixel.y * 0.1)) * 0.2 + 0.4;
        gl_FragColor = vec4(vec3(checker), 1.0);
        return;
    }
    
    // calculate how deeply we can peer into the ground
    float visible = (1.0 - depth * 0.2);
    
    // noise to counteract limited pallete banding
	float noise = fbm(point * 10.0 + 20.0);
    
    // final composition step
    vec3 color = color_curve(tone + 3.0 * STEP * visible + noise * STEP * 2.0);
    // vec3 color = vec3(visible);
    
    // tada!
    gl_FragColor = vec4(color,1.0);
}
