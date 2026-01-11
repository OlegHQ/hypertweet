package auth

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type UserRepo struct {
	coll *mongo.Collection
}

func NewUserRepo(db *mongo.Database) *UserRepo {
	return &UserRepo{coll: db.Collection("users")}
}

func (r *UserRepo) EnsureIndexes(ctx context.Context) error {
	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "Email", Value: 1}},
			Options: options.Index().
				SetUnique(true).
				SetPartialFilterExpression(bson.M{"Email": bson.M{"$type": "string"}}),
		},
	}
	_, err := r.coll.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		return fmt.Errorf("create user indexes: %w", err)
	}
	return nil
}

func (r *UserRepo) FindByID(ctx context.Context, id string) (*User, error) {
	var user User
	err := r.coll.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find user by id: %w", err)
	}
	return &user, nil
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*User, error) {
	var user User
	err := r.coll.FindOne(ctx, bson.M{"Email": email}).Decode(&user)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find user by email: %w", err)
	}
	return &user, nil
}

func (r *UserRepo) FindByRefreshToken(ctx context.Context, token string) (*User, error) {
	var user User
	err := r.coll.FindOne(ctx, bson.M{"RefreshToken": token}).Decode(&user)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find user by refresh token: %w", err)
	}
	return &user, nil
}

func (r *UserRepo) Insert(ctx context.Context, user *User) error {
	_, err := r.coll.InsertOne(ctx, user)
	if mongo.IsDuplicateKeyError(err) {
		return ErrUserAlreadyExists
	}
	if err != nil {
		return fmt.Errorf("insert user: %w", err)
	}
	return nil
}

func (r *UserRepo) UpdateRefreshToken(ctx context.Context, userID, refreshToken string, expiry time.Time) error {
	_, err := r.coll.UpdateOne(ctx,
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{
			"RefreshToken":       refreshToken,
			"RefreshTokenExpiry": expiry,
		}},
	)
	if err != nil {
		return fmt.Errorf("update refresh token: %w", err)
	}
	return nil
}

func (r *UserRepo) UpdatePassword(ctx context.Context, userID, passwordHash string) error {
	_, err := r.coll.UpdateOne(ctx,
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{"PasswordHash": passwordHash}},
	)
	if err != nil {
		return fmt.Errorf("update password: %w", err)
	}
	return nil
}

func (r *UserRepo) UpdateDisabledToneIds(ctx context.Context, userID string, disabledIds []string) error {
	_, err := r.coll.UpdateOne(ctx,
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{"DisabledToneIds": disabledIds}},
	)
	if err != nil {
		return fmt.Errorf("update disabled tone ids: %w", err)
	}
	return nil
}

func (r *UserRepo) Delete(ctx context.Context, userID string) error {
	result, err := r.coll.DeleteOne(ctx, bson.M{"_id": userID})
	if err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	if result.DeletedCount == 0 {
		return ErrUserNotFound
	}
	return nil
}
