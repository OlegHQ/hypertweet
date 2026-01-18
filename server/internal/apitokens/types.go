package apitokens

import "time"

type APIToken struct {
	ID         string     `bson:"_id" json:"id"`
	UserID     string     `bson:"UserId" json:"userId"`
	Name       string     `bson:"Name" json:"name"`
	TokenHash  string     `bson:"TokenHash" json:"-"`
	CreatedAt  time.Time  `bson:"CreatedAt" json:"createdAt"`
	LastUsedAt *time.Time `bson:"LastUsedAt,omitempty" json:"lastUsedAt,omitempty"`
	RevokedAt  *time.Time `bson:"RevokedAt,omitempty" json:"revokedAt,omitempty"`
}

type CreateRequest struct {
	Name string `json:"name"`
}

type CreateResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Token     string    `json:"token"`
	CreatedAt time.Time `json:"createdAt"`
}

type ListResponse struct {
	Tokens []APIToken `json:"tokens"`
}
