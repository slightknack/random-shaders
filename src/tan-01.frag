#ifdef GL_ES
precision mediump float;
#endif

# define SAMPLE 10.0
# define THICK 5.0

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float function(float x, float t) {
	return tan(x * (cos(t) * 2.9 + 3.0)) * sin(t)*sin(t) + cos(x + sin(t)*sin(t) * 20.0) * cos(t)*cos(t) * 2.0;
}

float grapher(vec2 pos, float pixel, float t) {
    float sampled = 0.0;

    for (float i = 0.0; i < SAMPLE; i++) {
        if (function(pos.x + (i / SAMPLE) * pixel * THICK, t) > pos.y) {
            sampled += 1.0;
        }
    }
    return sampled / SAMPLE;
}

float line(vec2 pos, float pixel, float t) {
    float actual = grapher(pos, pixel, t);
    float above  = 1.0 - grapher(vec2(pos.x, pos.y - THICK * pixel), pixel, t);
    float right  = 1.0 - grapher(vec2(pos.x - THICK * pixel, pos.y), pixel, t);
	return actual + above - right;
}

vec2 rotateUV(vec2 uv, float rotation)
{
    float mid = 0.5;
    return vec2(
        cos(rotation) * (uv.x - mid) + sin(rotation) * (uv.y - mid) + mid,
        cos(rotation) * (uv.y - mid) - sin(rotation) * (uv.x - mid) + mid
    );
}

float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    float r_time = mod(u_time / 30.0 + random(gl_FragCoord.xy) * 0.001, 3.14159265);
        
        // mod(cos(u_time / 5.0 + random(gl_FragCoord.xy) * 0.001), 3.14) * 2.0;
    float b_time = r_time - 0.1;
    float a_time = r_time - 0.05;
    vec2 center = vec2(-sin(r_time * 2.0) * 0.5, 0.0) * 5.0;
	float scale = 3.14 / 2.0 * 3.0;

    vec2 st = gl_FragCoord.xy/u_resolution.xy * 2.0 - 1.0; // between -1 and 1 for both x and y.
    st.x *= u_resolution.x/u_resolution.y; // between -1 and 1 for y, proportional to x.
    st = st * scale + center;
    st = rotateUV(st, (cos(r_time)*cos(r_time) * 0.5 - 0.5) * 3.14);

    float pixel = (1.0 / u_resolution.y) * scale;
    vec3 color = vec3(
        line(st, pixel, r_time),
        line(st, pixel, a_time),
        line(st, pixel, b_time)
    );

    gl_FragColor = vec4(1.0 - color, 1.0);
}
