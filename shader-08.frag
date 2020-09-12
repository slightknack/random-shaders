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

// mess around with this to adjust most of the program
# define START 0.0
# define END 4.0
# define STEPS 100
# define EPSILON 0.0003
# define BLUR 0.01
# define ITERATIONS 10
// # define POWER 6.2
# define TIMESCALE 0.05
# define FOV 120.0
# define ORBIT 2.0

// SIGNED DISTANCE FUNCTIONS ----------

// this is the mandelbulb distance estimator
// I stripped it from someone else's project, 
// but I've tweaked it quite a lot to make it work
float mandelbulb(vec3 r ) {
	float POWER = sin(u_time * TIMESCALE) * 12.0;
    vec3 zn = vec3(r.xyz);
	float rad = 0.0;
	float hit = 0.0;
	float d = 1.0;
	for (int i = 0; i < ITERATIONS; i++) {
		rad = length( zn );

        if (rad > 2.0) {	
            hit = 0.5 * log(rad) * rad / d;
        } else {
            float th = atan( length( zn.xy ), zn.z );
            float phi = atan(zn.y, zn.x);		
            float rado = pow(rad, 8.0);
            d = pow(rad, 7.0) * 7.0 * d + 1.0;

            float sint = sin( th * POWER );
            zn.x = rado * sint * cos( phi * POWER );
            zn.y = rado * sint * sin( phi * POWER );
            zn.z = rado * cos( th * POWER ) ;
            zn += r;
        }		
	}
	return hit;
}

// this is a simple box SDF, which was used in earlier tests
float box(vec3 point, vec3 size) {
    vec3 d = abs(point) - (size / 2.0);
    float insideDistance = min(max(d.x, max(d.y, d.z)), 0.0);
    float outsideDistance = length(max(d, 0.0));
    return insideDistance + outsideDistance;
}

// as the name suggests, this is a shpere, again used in earlier tests
float sphere(vec3 point, float radius) {
    return length(point) - radius;
}

// the is the whole scene
// the first line copies the bulb every 4 units, 
// and the second line puts the mandelbulb in that space
float scene (vec3 point) {
    // point = mod(point, 4.0) - 2.0;
    // float cube = box(point, vec3(1.0));
    // float sphere = sphere(point, sqrt(2.0) * 0.5);
    // return max(cube, sphere);
    return mandelbulb(point);
}

// RAY MARCHER ----------

// vanilla ray-marcher implementation
// returns more than just the dept
// depth, minimum distance, and number of steps
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

// this is a cheap(?) trick used to calculate the normals across the whole image
vec3 normal(vec3 p) {
    return normalize(vec3(
        scene(vec3(p.x + EPSILON, p.y, p.z)) - scene(vec3(p.x - EPSILON, p.y, p.z)),
        scene(vec3(p.x, p.y + EPSILON, p.z)) - scene(vec3(p.x, p.y - EPSILON, p.z)),
        scene(vec3(p.x, p.y, p.z  + EPSILON)) - scene(vec3(p.x, p.y, p.z - EPSILON))
    ));
}

// CAMERA ----------

// this function takes a coordinate, the screen's aspect ratio, and the FOV
// it uses this info to generate a ray normal to be used during marching
vec3 makeRay(float frame, float ratio, vec2 st) {
    vec2 xy = st - vec2(ratio, 1.0) * 0.5;
    float z = 1.0 / tan(radians(frame) / 2.0);
    return normalize(vec3(xy, -z));
}

// this is the classical "look at" function
// it takes a camera and a target
// then generates a matrix used to orient it later on
mat3 look(vec3 camera, vec3 target, vec3 up) {
    vec3 f = normalize(target - camera);
    vec3 s = normalize(cross(f, up));
    vec3 u = cross(s, f);
    return mat3(s, u, -f);
}

// a pseudo-random 2D hash used for motion blur.
// essentially, each pixel is offset by BLUR (constant) seconds
// which creates a slight (or not) grain effect in the direction of motion
float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// MAIN LOOP ----------

void main() {
    // converting raw coordinates to a scale from 0 to 1
    // note, the x-axis is stretched to maintain the aspect ratio
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;
    
    float i_time = (u_time + random(st) * BLUR) * TIMESCALE;
    
	float fov = cos(i_time * 2.0) * 50.0 + 70.0;    
    
    // create a new global time that takes motion blur and a timescale into account
    // make a ray normal based off the coordinate
    // make a camera point
    vec3 ray = makeRay(fov, u_resolution.x/u_resolution.y, st);
    vec3 camera = vec3(sin(i_time) * ORBIT, 0.0, cos(i_time) * ORBIT);    
    
    // rotate the camera to look at the center of the screen
    // rotate the ray accordingly
    mat3 view = look(camera, vec3(0.0), vec3(0.0, 1.0, 0.0));
    vec3 dir = view * ray;
    
    // march the scene and extract the features
    vec3 marchResults = march(camera, dir);
    float depth = marchResults.x;
    float minDistance = marchResults.y;
    float steps = marchResults.z;
    
    // add color and shadows
    vec3 color = vec3(0.0);
    
    // skip expensive color and lighting computations if no object was hit
    if (depth > END - EPSILON) {
		gl_FragColor = vec4(color, 0.0);
        return;
    }
    
    // the reason this is commented out is because 
    // the LOD distracts from the shape of the fractal at higher qualities
    // calculate the normals, cheap ambient occolusion, and key-lighting
    // combine them to get the object's color
    // vec3 normals = (normal(camera + depth * dir) + vec3(1.0)) / 2.0;
    float occolusion = 1.0 - ((steps + (random(st) * 2.0 - 1.0)) / float(STEPS));
    // float keyLight = float(smoothstep((normals.x + normals.y) / 2.0 + 0.5, 0.4, 0.6) * 0.5 + 0.5);
	color = vec3(pow(occolusion, 2.0));    
    
    // apply the color and render!
    gl_FragColor = vec4(color, 1.0);
}