package auth

import "time"

type User struct {
	ID                 string     `bson:"_id" json:"id"`
	Email              string     `bson:"Email" json:"email"`
	PasswordHash       string     `bson:"PasswordHash" json:"-"`
	DisabledToneIds    []string   `bson:"DisabledToneIds" json:"disabledToneIds"`
	RefreshToken       *string    `bson:"RefreshToken,omitempty" json:"-"`
	RefreshTokenExpiry *time.Time `bson:"RefreshTokenExpiry,omitempty" json:"-"`
	CreatedAt          time.Time  `bson:"CreatedAt" json:"createdAt"`
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
