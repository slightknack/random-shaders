// Author: RAYMARCHER, UNIQUE
// Title: ISAAC C.

// METADATA ----------

# ifdef GL_ES
precision mediump float;
# endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

// CONSTANTS ----------

# define START 1.0
# define END 1000.0
# define STEPS 70
# define EPSILON 0.001
# define BLUR 0.01
# define ITERATIONS 2
# define POWER 8.0

// SIGNED DISTANCE FUNCTIONS ----------

float hit( vec3 r )
{
	vec3 zn = vec3( r.xyz );
	float rad = 0.0;
	float hit = 0.0;
	float p = 8.0;
	float d = 1.0;
	for( int i = 0; i < 10; i++ ){
		rad = length( zn );

        if( rad > 2.0 ){	
            hit = 0.5 * log(rad) * rad / d;
        } else {

            float th = atan( length( zn.xy ), zn.z );
            float phi = atan( zn.y, zn.x );		
            float rado = pow(rad,8.0);
            d = pow(rad, 7.0) * 7.0 * d + 1.0;



            float sint = sin( th * p );
            zn.x = rado * sint * cos( phi * p );
            zn.y = rado * sint * sin( phi * p );
            zn.z = rado * cos( th * p ) ;
            zn += r;
        }		
	}
	return hit;
}

float box(vec3 point, vec3 size) {
    vec3 d = abs(point) - (size / 2.0);

    float insideDistance = min(max(d.x, max(d.y, d.z)), 0.0);
    float outsideDistance = length(max(d, 0.0));
    
    return insideDistance + outsideDistance;
}

float sphere(vec3 point, float radius) {
    return length(point) - radius;
}

float scene (vec3 point) {
    point = mod(point, 4.0) - 2.0;
    // float cube = box(point, vec3(2.0));
    // float sphere = sphere(point, sqrt(2.0));
    // return max(cube, sphere);
    return hit(point);
}

// RAY MARCHER ----------

// depth, minimum distance, number of steps
vec3 march(vec3 camera, vec3 ray) {
    float depth = START;
    float minDistance = END;
    float steps = 0.0;
    for (float steps = 0.0; steps < float(STEPS); steps++) {
        float distance = scene(camera + depth * ray);
        minDistance = min(minDistance, distance);
        
        depth += distance;
        
        if (distance < EPSILON) {
            return vec3(depth, minDistance, steps);
        }
        
        if (depth > END) {
            return vec3(END, minDistance, steps);
        }
    }
    return vec3(depth, minDistance, STEPS);
}

// SHADING AND COLORS ----------

vec3 normal(vec3 p) {
    return normalize(vec3(
        scene(vec3(p.x + EPSILON, p.y, p.z)) - scene(vec3(p.x - EPSILON, p.y, p.z)),
        scene(vec3(p.x, p.y + EPSILON, p.z)) - scene(vec3(p.x, p.y - EPSILON, p.z)),
        scene(vec3(p.x, p.y, p.z  + EPSILON)) - scene(vec3(p.x, p.y, p.z - EPSILON))
    ));
}

// CAMERA ----------

vec3 makeRay(float FOV, float ratio, vec2 st) {
    vec2 xy = st - vec2(ratio, 1.0) * 0.5;
    float z = 1.0 / tan(radians(FOV) / 2.0);
    return normalize(vec3(xy, -z));
}

mat3 look(vec3 camera, vec3 target, vec3 up) {
    // Based on gluLookAt man page
    vec3 f = normalize(target - camera);
    vec3 s = normalize(cross(f, up));
    vec3 u = cross(s, f);
    return mat3(s, u, -f);
}

float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// MAIN LOOP ----------

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;

    float i_time = (u_time + random(st) * BLUR) * 0.1;

    vec3 ray = makeRay(120.0, u_resolution.x/u_resolution.y, st);
    vec3 camera = vec3(sin(i_time * 0.67) * 100.0, 20.0 * sin(i_time) - 4.0, cos(i_time * 0.41) * 100.0);    
    
    mat3 view = look(camera, vec3(-4.0, -4.0, -4.0), vec3(0.0, 1.0, sin(i_time)));
    vec3 dir = view * ray;
    
    vec3 marchResults = march(camera, dir);
    float depth = marchResults.x;
    float minDistance = marchResults.y;
    float steps = marchResults.z;
    
    vec3 color = vec3(1.0);
    
    if (depth > END - EPSILON) {
        color = vec3(0.0); }
    // } else {
    //     vec3 point = camera + depth * dir;
    //     color = (normal(point) + vec3(1.0)) / 2.0;
    // } 
            
    gl_FragColor = vec4(color * 1.0 - (steps / float(STEPS)), 1.0);
}