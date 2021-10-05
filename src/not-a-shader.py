def reflect(point, base, w):
    return (
        base[0] + (base[0] - point[0]) * w, 
        base[1] + (base[1] - point[1]) * w,
    )

def midpoint(a, b, t):
    return (a[0]*t + b[0]*(1-t), a[1]*t + b[1]*(1-t))

def resolve_square(lis):
    new_lis = []
    wrap = len(lis)
    for i in range(len(lis)):
        (a, b) = (lis[i%wrap], lis[(i+1)%wrap])
        (c, d) = (lis[(i+2)%wrap], lis[(i+3)%wrap])
        x = reflect(a, b, 0.15)
        y = reflect(d, c, 0.15)
        z = midpoint(x, y, 0.5)
        new_lis.append(b)
        new_lis.append(z)
    new_lis += []
    return new_lis

def fit_circle(b, c, d):
  temp = c[0]**2 + c[1]**2
  bc = (b[0]**2 + b[1]**2 - temp) / 2
  cd = (temp - d[0]**2 - d[1]**2) / 2
  det = (b[0] - c[0]) * (c[1] - d[1]) - (c[0] - d[0]) * (b[1] - c[1])

  if abs(det) < 1.0e-10:
    return None

  # Center of circle
  cx = (bc*(c[1] - d[1]) - cd*(b[1] - c[1])) / det
  cy = ((b[0] - c[0]) * cd - (c[0] - d[0]) * bc) / det

  radius = ((cx - b[0])**2 + (cy - b[1])**2)**.5

  return (cx, cy, radius)

print(fit_circle((0, 0), (0, 1), (1, 1)))

import numpy as np

def angle_between(p1, p2):
    ang1 = np.arctan2(*p1[::-1])
    ang2 = np.arctan2(*p2[::-1])
    return np.rad2deg((ang1 - ang2) % (2 * np.pi))

def resolve_circle(lis):
    new_lis = []
    wrap = len(lis)
    for i in range(len(lis)):
        (a, b, c) = (lis[i%wrap], lis[(i+1)%wrap], lis[(i+2)%wrap])
        (x, y, r) = fit_circle(a, b, c)
        

lis = [(0, 0), (0, 1), (1, 1), (1, 0)]

for j in range(8):
    lis = resolve_square(lis)

for pair in lis:
    print(pair)
