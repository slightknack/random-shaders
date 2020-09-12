// Author:
// Title:

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

vec2 center = vec2(0.0, 0.0) + sin(u_time);
float scale = 8.0;

float function(float x) {
	return sin(x * 1.0 * sin(x));
}

float grapher(vec2 pos, float pixel) {
    float y;
    
    vec3 values = vec3(
        function(pos.x - pixel), 
        function(pos.x + pixel),
        function(pos.x)
    );
    
    if (values.x < pos.y && pos.y < values.y) {
        return 0.0;
    }
    
    if (values.x > pos.y && pos.y > values.y) {
        return 0.0;
    }
    
    if (values.z > pos.y )
    
    return 1.0;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy * 2.0 - 1.0; // between -1 and 1 for both x and y.
    st.x *= u_resolution.x/u_resolution.y; // between -1 and 1 for y, proportional to x.
    st = st * scale + center;
    
    float pixel = (1.0 / u_resolution.y) * scale;

    vec3 color = vec3(grapher(st, pixel));

    gl_FragColor = vec4(color,1.0);
}

