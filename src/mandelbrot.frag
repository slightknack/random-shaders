vec3 ring_color(in float angle) {
    // converts a number into a rainbow
    return vec3(
        pow(sin(angle + 0.00), 2.0),
        pow(sin(angle + 2.09), 2.0),
        pow(sin(angle + 4.19), 2.0)
    );
}

vec3 in_set(in vec2 coord) {
    // determine whether a number is in a set
    // if it isn't, determine a color using an iteration
    vec2 z = coord;
    for (int i = 0; i < 300; i++) {
        z = vec2(
            (z.x*z.x) - (z.y*z.y) + coord.x,
            2.0*(z.x)*(z.y) + coord.y
        );
        if (length(z) > sqrt(5.0)) { return ring_color(float(i) / 31.8); } 
    }
    return vec3(0.0);
}

#define SAMPLE 2

vec3 sample_set(in vec2 coord, in vec2 pixel) {
    // uniform sampling across each pixel
    vec3 total = vec3(0.0);
    for (int a = 0; a < SAMPLE; a++) {
        for (int b = 0; b < SAMPLE; b++) {
            vec2 loc = coord + vec2(a, b) / float(SAMPLE) * pixel;
            total += in_set(loc);
        }
    }
    return total / float(SAMPLE*SAMPLE);
}

mat2 rotate(float a){
    return mat2(cos(a),-sin(a),
                sin(a), cos(a));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // normalize coords
    vec2 uv = fragCoord/iResolution.xy * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    
    // calculate zoom level, power of e for smooth scaling
    float zoom = (-cos(iTime * 0.05) * 0.5 + 0.5) * 24.0;
    float scale = 2.0 / pow(2.72, zoom * 0.5);
    uv *= scale;
    
    // position to zoom into
    uv -= (iMouse.xy/iResolution.xy * 2.0 - 1.0)*scale;
    uv *= rotate(iTime * 0.09);
    uv += vec2(-.745,.186);
    
    // sample pixel SAMPLE^2 times
    vec2 pixel = (1.0 / iResolution.xy) * (vec2(1.0, iResolution.x/iResolution.y) * scale);
    vec3 col = sample_set(uv, pixel);
    fragColor = vec4(col,1.0);
}
