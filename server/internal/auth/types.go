package auth

import "time"

type User struct {
	ID                 string     `bson:"_id" json:"id"`
	Email              string     `bson:"email" json:"email"`
	PasswordHash       string     `bson:"passwordHash" json:"-"`
	DisabledToneIds    []string   `bson:"disabledToneIds" json:"disabledToneIds"`
	RefreshToken       *string    `bson:"refreshToken,omitempty" json:"-"`
	RefreshTokenExpiry *time.Time `bson:"refreshTokenExpiry,omitempty" json:"-"`
	CreatedAt          time.Time  `bson:"createdAt" json:"createdAt"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refreshToken"`
}

type TokenResult struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int    `json:"expiresIn"`
}

type RefreshResponse struct {
	Token string `json:"token"`
}
