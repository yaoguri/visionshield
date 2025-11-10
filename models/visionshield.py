# models/visionshield.py
# VisionShield deepfake detection model based on ResNet50+LSTM architecture

import os
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import numpy as np
from PIL import Image
import cv2

class ResNet50FeatureExtractor(nn.Module):
    """Feature extractor using ResNet50"""
    def __init__(self):
        super(ResNet50FeatureExtractor, self).__init__()
        from torchvision.models import resnet50, ResNet50_Weights
        base_model = resnet50(weights=ResNet50_Weights.DEFAULT)
        self.feature_extractor = torch.nn.Sequential(*list(base_model.children())[:-1])
        self.feature_size = 2048

        # Freeze the CNN layers (for initial training or inference)
        for param in self.feature_extractor.parameters():
            param.requires_grad = False

    def forward(self, x):
        features = self.feature_extractor(x)
        return features.squeeze()

    def unfreeze(self):
        """Unfreeze the CNN layers for fine-tuning"""
        for param in self.feature_extractor.parameters():
            param.requires_grad = True


class VisionShield(nn.Module):
    """
    VisionShield: CNN-RNN hybrid model for deepfake detection
    Combines spatial features (ResNet50) with temporal analysis (LSTM)
    """
    def __init__(self, feature_size=512, hidden_size=256,
                 num_layers=2, num_classes=2, dropout=0.5):
        super(VisionShield, self).__init__()

        # CNN feature extractor
        self.feature_extractor = ResNet50FeatureExtractor()
        self.cnn_feature_size = self.feature_extractor.feature_size  # This is 2048 for ResNet50

        # Feature fusion layer (reduce dimensionality)
        self.fusion = nn.Sequential(
            nn.Linear(self.cnn_feature_size, feature_size),  # Reduce from 2048 to feature_size
            nn.ReLU(),
            nn.Dropout(dropout)
        )

        # LSTM for temporal analysis
        self.lstm = nn.LSTM(
            input_size=feature_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=True
        )

        # Classification layer
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size),  # *2 for bidirectional
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size, num_classes)
        )

    def forward(self, x):
        batch_size, seq_len, c, h, w = x.shape

        # Process each frame with CNN
        cnn_features = []
        for i in range(seq_len):
            features = self.feature_extractor(x[:, i])
            # Make sure features are 2D [batch_size, feature_dim]
            if features.dim() == 1:
                features = features.unsqueeze(0)
            cnn_features.append(features)

        # Stack features and handle different possible shapes
        cnn_features = torch.stack(cnn_features, dim=1)  # [batch, seq_len, cnn_feature_size]

        # Handle various possible shapes
        if cnn_features.dim() == 4:  # If shape is [batch, seq_len, 1, cnn_feature_size]
            cnn_features = cnn_features.squeeze(2)

        # Apply fusion layer to reduce dimensionality
        if cnn_features.dim() == 3:
            batch_size, seq_len, feat_dim = cnn_features.shape
            reshaped_features = cnn_features.reshape(-1, feat_dim)
            fused_flat = self.fusion(reshaped_features)
            fused_features = fused_flat.reshape(batch_size, seq_len, -1)
        elif cnn_features.dim() == 2:
            total_size, feat_dim = cnn_features.shape
            inferred_batch = total_size // seq_len
            if inferred_batch * seq_len != total_size:
                fused_flat = self.fusion(cnn_features)
                fused_features = fused_flat.reshape(batch_size, seq_len, -1)
            else:
                fused_flat = self.fusion(cnn_features)
                fused_features = fused_flat.reshape(inferred_batch, seq_len, -1)
        else:
            fused_flat = self.fusion(cnn_features.reshape(-1, self.cnn_feature_size))
            fused_features = fused_flat.reshape(batch_size, seq_len, -1)

        # Process sequence with LSTM
        lstm_out, _ = self.lstm(fused_features)

        # Take features from last time step
        lstm_features = lstm_out[:, -1, :]

        # Classification
        output = self.classifier(lstm_features)

        return output