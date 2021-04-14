#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

#define DIVS 32.0

// 2D Random
float random (in vec2 st, float seed) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) + seed * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise(in vec2 coords, float seed) {
    vec2 i = floor(coords);
    vec2 f = fract(coords);

    // Four corners in 2D of a tile
    float a = random(i, seed);
    float b = random(i + vec2(1.0, 0.0), seed);
    float c = random(i + vec2(0.0, 1.0), seed);
    float d = random(i + vec2(1.0, 1.0), seed);

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a) * u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float temporal_noise(in vec2 coords, float t, float seed) {
    float f = fract(t);
	float u = f*f*(3.0-2.0*f);
    int offset = int(floor(t));
    float layer_0 = noise(coords, seed + float(offset));
    float layer_1 = noise(coords, seed + 1.0 + float(offset));
    
    return mix(layer_0, layer_1, u);
}

float capsule(vec2 p, vec2 a, vec2 b, float r ) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
  return length( pa - ba*h ) - r;
}

float in_line(vec2 noise, vec2 local, vec2 global) {
    float line_width = length(noise - 0.5) * 0.4;

    float distance = capsule(
        local,
        (global + 0.5),
        (global + 0.5) + ((noise - 0.5) * (5.0 - 0.4) + 0.5) - 0.5,
        line_width
    );
    
    return distance + 0.05;
}

vec2 anenome_stretch(vec2 coords, float time) {
    float shift_x = temporal_noise(coords * 3.0, time + 0.00, 3.0);
    float shift_y = temporal_noise(coords * 3.0, time + 1.57, 4.0);
    float x = temporal_noise(coords * 3.0 + shift_x, time + 0.00, 0.0);
    float y = temporal_noise(coords * 3.0  + shift_y, time + 1.57, 1.0);
    return vec2(x, y);
}

vec3 color_stretch(vec2 coords, float time) {
    float x = temporal_noise(coords, time + 0.00, 0.0);
    float y = temporal_noise(coords, time + 2.09, 1.0);
    float z = temporal_noise(coords, time + 4.19, 2.0);
    return vec3(x, y, z);
}

float overlaps(vec2 fractional, vec2 local, float time) {
    float nearest = 0.0;

    for (float i = -2.0; i <= 2.0; i++) {
        for (float j = -2.0; j <= 2.0; j++) {
            vec2 stretch = anenome_stretch(
                vec2(
                    fractional.x + (i / DIVS),
                    fractional.y + (j / DIVS)
                ),
                time
            );
            float distance = in_line(stretch, local, vec2(i, j));
            float smooth = smoothstep(0.0, 0.05, distance);
            nearest = (1.0 - smooth + nearest);
        }
    }

    return nearest / 1.5;
}

void main() {
    vec2 global = gl_FragCoord.xy/u_resolution.xy;
    global.x *= u_resolution.x / u_resolution.y;
    vec2 local = fract(global * DIVS);
	vec2 fractional = floor(global * DIVS) / DIVS;

    float time = u_time * 0.3;

    float distance = overlaps(fractional + 5.0 * vec2(sin(time), cos(time)) / DIVS, local, time);
    vec3 color = color_stretch(fractional, time);

    // smoothstep(0.0, 0.05, distance)
// vec3(thing > 0.0, thing_2 > 0.0, 0.5)
    gl_FragColor = vec4(vec3(distance) * color * 1.0, 1.0);
}
