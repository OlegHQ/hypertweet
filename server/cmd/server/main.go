package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/hypertweet/server/internal/ai"
	"github.com/hypertweet/server/internal/apitokens"
	"github.com/hypertweet/server/internal/auth"
	"github.com/hypertweet/server/internal/config"
	"github.com/hypertweet/server/internal/db"
	"github.com/hypertweet/server/internal/mcp"
	"github.com/hypertweet/server/internal/middleware"
	"github.com/hypertweet/server/internal/profiles"
	"github.com/hypertweet/server/internal/tones"
	"github.com/hypertweet/server/internal/tracing"
)

func main() {
	log := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	cfg, err := config.Load()
	if err != nil {
		log.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	ctx := context.Background()
	database, err := db.Connect(ctx, cfg.MongoURI, cfg.DatabaseName)
	if err != nil {
		log.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	log.Info("connected to database", "database", cfg.DatabaseName)

	userRepo := auth.NewUserRepo(database)
	profileRepo := profiles.NewProfileRepo(database)
	toneRepo := tones.NewToneRepo(database)
	traceRepo := tracing.NewTraceRepo(database)
	apiTokenRepo := apitokens.NewRepo(database)

	log.Info("generating database indexes...")
	if err := userRepo.EnsureIndexes(ctx); err != nil {
		log.Warn("failed to create user indexes (may need data cleanup)", "error", err)
	}
	if err := traceRepo.EnsureIndexes(ctx); err != nil {
		log.Warn("failed to create trace indexes", "error", err)
	}
	if err := apiTokenRepo.EnsureIndexes(ctx); err != nil {
		log.Warn("failed to create api token indexes", "error", err)
	}
	log.Info("database indexes generated")

	authService := auth.NewAuthService(cfg.JwtSecret, cfg.JwtIssuer, cfg.JwtAudience, cfg.JwtExpiryDays, cfg.RefreshTokenExpiryDays)
	groqClient := ai.NewGroqClient(cfg.GroqAPIKey)
	aiService := ai.NewService(groqClient, userRepo, profileRepo, toneRepo, traceRepo, log)

	authHandler := auth.NewHandler(userRepo, authService, log)
	profileHandler := profiles.NewHandler(profileRepo, userRepo, log)
	toneHandler := tones.NewHandler(toneRepo, userRepo, log)
	aiHandler := ai.NewHandler(aiService, log)
	apiTokenHandler := apitokens.NewHandler(apiTokenRepo, log)
	mcpHandler := mcp.NewHandler(userRepo, profileRepo, toneRepo, log)

	authMiddleware := middleware.NewAuthMiddleware(cfg.JwtSecret, cfg.JwtIssuer, cfg.JwtAudience)
	apiTokenMiddleware := middleware.NewAPITokenMiddleware(apiTokenRepo, log)

	mux := http.NewServeMux()

	// Health check - exact root path only
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("working"))
	})

	// Public auth routes
	mux.HandleFunc("POST /auth/register", authHandler.Register)
	mux.HandleFunc("POST /auth/login", authHandler.Login)
	mux.HandleFunc("POST /auth/refresh", authHandler.Refresh)

	// Protected routes - wrap each with auth middleware
	mux.Handle("GET /profile", authMiddleware.Protect(http.HandlerFunc(profileHandler.GetProfile)))
	mux.Handle("POST /profile/update", authMiddleware.Protect(http.HandlerFunc(profileHandler.UpdateProfile)))
	mux.Handle("POST /profile/password", authMiddleware.Protect(http.HandlerFunc(profileHandler.UpdatePassword)))
	mux.Handle("DELETE /users", authMiddleware.Protect(http.HandlerFunc(profileHandler.DeleteUser)))
	mux.Handle("GET /profile/available-models", authMiddleware.Protect(http.HandlerFunc(profileHandler.ListModels)))

	mux.Handle("GET /tones", authMiddleware.Protect(http.HandlerFunc(toneHandler.List)))
	mux.Handle("POST /tones", authMiddleware.Protect(http.HandlerFunc(toneHandler.Create)))
	mux.Handle("PUT /tones/{id}", authMiddleware.Protect(http.HandlerFunc(toneHandler.Update)))
	mux.Handle("DELETE /tones/{id}", authMiddleware.Protect(http.HandlerFunc(toneHandler.Delete)))
	mux.Handle("POST /tones/{id}/toggle", authMiddleware.Protect(http.HandlerFunc(toneHandler.ToggleDefault)))

	mux.Handle("GET /api-tokens", authMiddleware.Protect(http.HandlerFunc(apiTokenHandler.List)))
	mux.Handle("POST /api-tokens", authMiddleware.Protect(http.HandlerFunc(apiTokenHandler.Create)))
	mux.Handle("POST /api-tokens/{id}/revoke", authMiddleware.Protect(http.HandlerFunc(apiTokenHandler.Revoke)))

	mux.Handle("GET /mcp", apiTokenMiddleware.Protect(mcpHandler))
	mux.Handle("POST /mcp", apiTokenMiddleware.Protect(mcpHandler))

	mux.Handle("POST /ai/reply", authMiddleware.Protect(http.HandlerFunc(aiHandler.Reply)))
	mux.Handle("POST /ai/refine", authMiddleware.Protect(http.HandlerFunc(aiHandler.Refine)))
	mux.Handle("POST /ai/chat", authMiddleware.Protect(http.HandlerFunc(aiHandler.Chat)))

	handler := middleware.CORS(mux)
	handler = middleware.Logging(log)(handler)

	addr := fmt.Sprintf("0.0.0.0:%s", cfg.Port)
	srv := &http.Server{
		Addr:    addr,
		Handler: handler,
	}

	go func() {
		log.Info("server starting", "addr", addr)
		if err := srv.ListenAndServe(); err != http.ErrServerClosed {
			log.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error("server shutdown error", "error", err)
	}

	if err := db.Disconnect(shutdownCtx, database); err != nil {
		log.Error("database disconnect error", "error", err)
	}

	log.Info("server stopped")
}
