#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265358979
#define SEP 0.5
#define BAR 0.20
#define THICK 0.02
#define BLEND 0.01
#define SPEED 0.2
#define RAMP 1.5
#define TILT (1.0 / (SEP / RAMP))
// #define SPIN
#define JUMP
#define SPLIT

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

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

vec3 split_strand(vec2 st, bool split) {
    float transition = hump(-RAMP, 0., st.x);
    
    vec3 bar;
    
    if (split) {
        bar = normal_strand(st);
    } else {
        bar = straight_strand(st);
    }
    
    float inner = bar.x;
    float outer = bar.y;
    vec3 color = vec3(bar.z);
    
    float tilt = 0.; // abs(st.y / TILT / THICK) * transition;
    float bars = sin((st.x - u_time * SPEED) / THICK + tilt);
    
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
    
    color = max(color, vec3(smoothstep(0., 0.5, bars)));
    
    return color;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy * 2. - 1.;
    st.x *= u_resolution.x/u_resolution.y;
    st.x += mod(u_time * SPEED, RAMP * 0.5);
    
    // leading
    vec3 color = split_strand(st, true);

    // trailing
    color += split_strand(vec2(st.x, -st.y), true);
    
    // coming in top
    color += split_strand(vec2(st.x, st.y - (SEP * 2. - BAR)), false) * smoothstep(0., RAMP, st.x);
    
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
    color += split_strand(vec2(st.x, -st.y - (SEP * 2. - BAR)), false) * lower;
        
    gl_FragColor = vec4(vec3(color), 1.0);
}
