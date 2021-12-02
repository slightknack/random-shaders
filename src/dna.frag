#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265358979
#define SEP 0.5
#define BAR 0.20
#define THICK 0.025
#define BLEND 0.01
#define SPEED 0.4
#define OKAZAKI 6.0
#define WIDTH (PI * BAR * 0.5)
#define RAMP (WIDTH * OKAZAKI)
#define TILT (1.0 / (SEP / RAMP))
// #define SPIN
#define JUMP
#define SPLIT

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

#define A vec3(1.000,0.775,0.074)
#define T vec3(1.000,0.444,0.280)
#define C vec3(0.250,0.424,1.000)
#define G vec3(0.056,0.914,1.000)

vec3 color_base(float choice) {
    if (choice < 1.) { return A; }
    if (choice < 2.) { return C; }
    if (choice < 3.) { return G; }
    return T;
}

// #define u_time mod(u_time, (RAMP * 0.5) / SPEED)

float random2(vec2 st) {
    return fract(sin(dot(st.xy,
        vec2(12.9898,78.233)))*
             43758.5453123);
}

// hump between -0.5 and 0.5 with max of 1 at 0
float hump(float start, float stop, float x) {
    float middle = (start + stop) * 0.5;
    return smoothstep(start, middle, x) - smoothstep(middle, stop, x);
}

vec3 normal_strand(vec2 st) {
    float inner = st.y - smoothstep(-RAMP, 0., st.x) * SEP;
    float outer = inner - BAR;
    float bar = smoothstep(BLEND + THICK, THICK, abs(outer));
    return vec3(inner, outer, bar);
}

vec3 straight_strand(vec2 st) {
    float inner = st.y + SEP;
    float outer = inner - BAR;
    float bar = smoothstep(BLEND + THICK, THICK, abs(inner));
    return vec3(inner, outer, bar);
}

vec3 split_strand(vec2 st, bool split, bool top) {
    float transition = hump(-RAMP, 0., st.x);
    
    vec3 bar = straight_strand(st);
    if (split) {
        bar = normal_strand(st);
    }
    
    float inner = bar.x;
    float outer = bar.y;
    vec3 color = vec3(bar.z);
    
    float tilt = 0.; // abs(st.y / TILT / THICK) * transition;
    float bars = sin(PI * 1.5 + (st.x - u_time * SPEED) / THICK + tilt);
    float base = random2(vec2(floor((st.x - u_time * SPEED) / THICK / PI * 0.5), 0.));
	
    if (top) {
        base = -(base - 0.5) + 0.5;
    }
    
    vec3 base_color = color_base(base * 4.);
    
    
    
    #ifdef JUMP
        #ifdef SPIN
            bars *= smoothstep(0.0, -BLEND, min(outer, inner - transition * BAR * 2.0));
            bars *= smoothstep(-BLEND, 0.0, max(outer, inner - transition * BAR * 2.0));
        #else
            bars *= smoothstep(0.0, -BLEND, outer - transition * BAR);
            bars *= smoothstep(-BLEND, 0.0, inner - transition * BAR);
        #endif
    #else
        bars *= smoothstep(0.0, -BLEND, outer);
        bars *= smoothstep(-BLEND, 0.0, inner);
    #endif
    
    color = max(color, base_color * vec3(smoothstep(0., 0.5, bars)));
    
    return color;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy * 2. - 1.;
    st.x *= u_resolution.x/u_resolution.y;
    // st.x += mod(u_time * SPEED, RAMP * 0.5);
    // st.x += u_time * SPEED;
    
    // leading
    vec3 color = split_strand(st, true, true);

    // trailing
    color += split_strand(vec2(st.x, -st.y), true, false);
    
    // coming in top
    color += split_strand(vec2(st.x, st.y - (SEP * 2. - BAR)), false, false) * smoothstep(0., RAMP, st.x);
    
    // coming in bottom
    // float okazaki = mod(-u_time * SPEED * 2.0, RAMP);
    // float okazaki = mod(u_time * SPEED * , RAMP);
    
    float trailing  = mod(u_time * SPEED, RAMP);
	float okazaki   = mod(u_time * SPEED * 2.0, RAMP * 2.0);
    float lower  = smoothstep(RAMP,     RAMP     + BLEND, st.x);
    lower += 1.0 - smoothstep(okazaki,  okazaki  + BLEND, st.x);
    lower -= 1.0 - smoothstep(trailing, trailing + BLEND, st.x);
    
    {
        float u_time_plus = u_time + (RAMP / SPEED) * 0.5;
        float trailing  = mod(u_time_plus * SPEED, RAMP);
        float okazaki   = mod(u_time_plus * SPEED * 2.0, RAMP * 2.0);
        lower += 1.0 - smoothstep(okazaki,  okazaki  + BLEND, st.x);
        lower -= 1.0 - smoothstep(trailing, trailing + BLEND, st.x);
    }
    
    lower = clamp(0., lower, 1.);
    color += split_strand(vec2(st.x, -st.y - (SEP * 2. - BAR)), false, true) * lower;
    
    gl_FragColor = vec4(vec3(color), 1.0);
}
