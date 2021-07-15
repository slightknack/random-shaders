# ifdef GL_ES
precision highp float;
# endif

uniform vec2 u_resolution;
uniform float u_time;

// mess around with this to adjust most of the program
# define START 0.0
# define END 70.0
# define STEPS 70
# define EPSILON 0.015
# define ITERATIONS 2
# define POWER 8.0
# define TIMESCALE 0.1
# define FOV 110.0

// this is the mandelbulb distance estimator
// I stripped it from someone else's project, 
// but I've tweaked it quite a lot to make it work
float mandelbulb( vec3 r ) {
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

// the is the whole scene
// the first line copies the bulb every 4 units, 
// and the second line puts the mandelbulb in that space
float scene (vec3 point) {
    return mandelbulb(point);
}


// vanilla ray-marcher implementation
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

// this function takes a coordinate, the screen's aspect ratio, and the FOV
// it uses this info to generate a ray normal to be used during marching
vec3 makeRay(float frame, float ratio, vec2 st) {
    vec2 xy = st - vec2(ratio, 1.0) * 0.5;
    float z = 1.0 / tan(radians(frame) / 2.0);
    return normalize(vec3(xy, -z));
}

// look at takes a camera and a target
// then generates a matrix used to orient it later on
mat3 look(vec3 camera, vec3 target, vec3 up) {
    vec3 f = normalize(target - camera);
    vec3 s = normalize(cross(f, up));
    vec3 u = cross(s, f);
    return mat3(s, u, -f);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;

    // create a new global time that takes motion blur and a timescale into account
    float time = u_time * TIMESCALE;

    // make a ray and camera point
    vec3 ray = makeRay(FOV, u_resolution.x/u_resolution.y, st);
    vec3 camera = vec3(sin(time) * 3.0, 1.0, cos(time) * 3.0);
    
    // rotate the camera by rotating the ray
    mat3 view = look(camera, vec3(0.0), vec3(0.0, 1.0, 0.0));
    vec3 dir = view * ray;
    
    // march the scene and extract the features
    vec3 marchResults = march(camera, dir);
    float depth = marchResults.x;
    float minDistance = marchResults.y;
    float steps = marchResults.z;
    
    // add color and shadows
    vec3 color = vec3(0.0);
    
    // calculate the normals, cheap ambient occlusion, and key-lighting
    // combine them to get the object's color
    vec3 normals = (normal(camera + depth * dir) + vec3(1.0)) / 2.0;
    float occlusion = 1.0 - (steps / float(STEPS));
	color = normals * occlusion;  
    
    if (depth < END - EPSILON) {
		color = vec3(occlusion * 0.7 + (1.0 - normals) * 0.3);
    }
    
    // apply the color and render!
    gl_FragColor = vec4(vec3(minDistance * 50.0 / END + color), 1.0);
}
