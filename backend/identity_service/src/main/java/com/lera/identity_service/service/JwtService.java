package com.lera.identity_service.service;

import com.lera.identity_service.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {
    
    @Value("${jwt.secret}")
    private String secretKey;
    
    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration; // 24 hours
    
    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration; // 7 days

    private final org.springframework.core.env.Environment environment;

    public JwtService(org.springframework.core.env.Environment environment) {
        this.environment = environment;
    }

    /**
     * SECURITY: reject a weak shared signing key at startup. A short/low-entropy JWT_SECRET could
     * be brute-forced to forge admin tokens accepted by every service. Fail fast in deployed
     * profiles; warn in dev.
     */
    @jakarta.annotation.PostConstruct
    void validateSecretStrength() {
        int bytes;
        try {
            bytes = Decoders.BASE64.decode(secretKey).length;
        } catch (Exception e) {
            bytes = secretKey == null ? 0 : secretKey.getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
        }
        boolean deployed = java.util.Arrays.stream(environment.getActiveProfiles())
                .anyMatch(p -> p.equalsIgnoreCase("prod") || p.equalsIgnoreCase("docker") || p.equalsIgnoreCase("staging"));
        if (bytes < 32) {
            if (deployed) {
                throw new IllegalStateException(
                        "JWT_SECRET is too weak (" + bytes + " bytes) — require >= 32 bytes (256-bit). "
                                + "Generate one with: openssl rand -base64 48");
            }
            System.err.println("WARN: JWT secret is < 32 bytes — acceptable for dev, MUST be >= 32 bytes in prod.");
        }
    }

    /** Access-token lifetime in seconds — used for cookie Max-Age. */
    public long getAccessTokenSeconds() { return jwtExpiration / 1000; }

    /** Refresh-token lifetime in seconds — used for cookie Max-Age. */
    public long getRefreshTokenSeconds() { return refreshExpiration / 1000; }
    
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    public String generateToken(User user) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getId().toString());
        extraClaims.put("centerId", user.getCenterId() != null ? user.getCenterId().toString() : null);
        extraClaims.put("roleId", user.getRoleId() != null ? user.getRoleId().toString() : null);
        // Include roleName so other microservices can enforce @PreAuthorize without DB lookup
        String roleName = user.getRole() != null ? user.getRole().getName() : null;
        extraClaims.put("roleName", roleName);
        return generateToken(extraClaims, user);
    }
    
    public String generateToken(Map<String, Object> extraClaims, User user) {
        // Mark this as an ACCESS token so a long-lived refresh token can't be
        // replayed as a bearer credential, and stamp the user's tokenVersion so
        // a password change/reset can invalidate outstanding refresh tokens.
        extraClaims.put("tokenType", "access");
        extraClaims.put("tv", currentTokenVersion(user));
        return buildToken(extraClaims, user, jwtExpiration);
    }

    public String generateRefreshToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("tokenType", "refresh");
        claims.put("tv", currentTokenVersion(user));
        return buildToken(claims, user, refreshExpiration);
    }

    private static int currentTokenVersion(User user) {
        return user.getTokenVersion() == null ? 0 : user.getTokenVersion();
    }

    /** "access" or "refresh" (null for legacy tokens issued before this claim existed). */
    public String extractTokenType(String token) {
        try { return extractClaim(token, c -> c.get("tokenType", String.class)); }
        catch (Exception e) { return null; }
    }

    /** Token's stamped tokenVersion, or 0 if absent (legacy token). */
    public int extractTokenVersion(String token) {
        try {
            Integer tv = extractClaim(token, c -> c.get("tv", Integer.class));
            return tv == null ? 0 : tv;
        } catch (Exception e) { return 0; }
    }
    
    private String buildToken(Map<String, Object> extraClaims, User user, long expiration) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(user.getEmail())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    
    public boolean isTokenValid(String token, User user) {
        final String username = extractUsername(token);
        return (username.equals(user.getEmail())) && !isTokenExpired(token);
    }
    
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    
    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
