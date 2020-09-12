// Author:
// Title:

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

vec2 center = vec2(0.0, 0.0) + u_mouse / u_resolution * 4.0;
float scale = 1.0 + sin(u_time);

float function(float x) {
	return sin(x * 100.0 * sin(x));
}

float grapher(vec2 pos, float pixel) {
    float y;
    
    int strength = 0;
    int total = 0;
    
    // TODO: refactor pixel out of loop decl.
    for (float i = -pixel; i < pixel; i += pixel / 4.0) {
        float value = function(i + pos.x);
        for (float j = -pixel; j < pixel; j += pixel / 4.0) {
        	float range = j + pos.y;
            
            if (value <= range && range >= value) {
                strength++;
            }
			if (value >= range && range <= value) {
                strength++;
            }
            
            total += 2;
    	}
    }
    
    return float(strength) / float(total);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy * 2.0 - 1.0; // between -1 and 1 for both x and y.
    st.x *= u_resolution.x/u_resolution.y; // between -1 and 1 for y, proportional to x.
    st = st * scale + center;
    
    float pixel = (1.0 / u_resolution.y) * scale;

    vec3 color = vec3(grapher(st, pixel));

    gl_FragColor = vec4(color,1.0);
}

