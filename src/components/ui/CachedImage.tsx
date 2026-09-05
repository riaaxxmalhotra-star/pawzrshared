import React, { useState, useCallback } from 'react';
import {
  Image,
  ImageProps,
  ImageStyle,
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

type PlaceholderType = 'user' | 'pet' | 'vet' | 'groomer' | 'cafe' | 'supplier' | 'event' | 'generic';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri?: string | null;
  fallbackUri?: string;
  placeholderType?: PlaceholderType;
  placeholderText?: string;
  showLoading?: boolean;
  style?: ImageStyle;
  containerStyle?: ImageStyle;
}

// Default placeholder images (can be replaced with actual assets)
const getPlaceholderConfig = (type: PlaceholderType) => {
  switch (type) {
    case 'user':
      return { icon: 'person', color: colors.primary, bg: `${colors.primary}15` };
    case 'pet':
      return { icon: 'paw', color: colors.primary, bg: `${colors.primary}15` };
    case 'vet':
      return { icon: 'medical', color: '#10B981', bg: '#10B98115' };
    case 'groomer':
      return { icon: 'cut', color: '#8B5CF6', bg: '#8B5CF615' };
    case 'cafe':
      return { icon: 'cafe', color: '#14B8A6', bg: '#14B8A615' };
    case 'supplier':
      return { icon: 'storefront', color: '#3B82F6', bg: '#3B82F615' };
    case 'event':
      return { icon: 'calendar', color: colors.primary, bg: `${colors.primary}15` };
    default:
      return { icon: 'image', color: colors.gray[400], bg: colors.gray[100] };
  }
};

export default function CachedImage({
  uri,
  fallbackUri,
  placeholderType = 'generic',
  placeholderText,
  showLoading = true,
  style,
  containerStyle,
  ...rest
}: CachedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    if (fallbackUri && !usingFallback) {
      setUsingFallback(true);
      setError(false);
    } else {
      setError(true);
    }
  }, [fallbackUri, usingFallback]);

  const placeholderConfig = getPlaceholderConfig(placeholderType);

  // If no URI or error without fallback, show placeholder
  if (!uri || (error && !fallbackUri) || (error && usingFallback)) {
    const imageStyle = StyleSheet.flatten(style);
    const size = Math.min(
      (imageStyle?.width as number) || 100,
      (imageStyle?.height as number) || 100
    );
    const iconSize = Math.max(size * 0.4, 20);

    return (
      <View
        style={[
          styles.placeholder,
          {
            backgroundColor: placeholderConfig.bg,
            width: imageStyle?.width,
            height: imageStyle?.height,
            borderRadius: imageStyle?.borderRadius,
          },
          containerStyle,
        ]}
      >
        {placeholderText ? (
          <Text
            style={[
              styles.placeholderText,
              { color: placeholderConfig.color, fontSize: iconSize * 0.6 },
            ]}
          >
            {placeholderText.charAt(0).toUpperCase()}
          </Text>
        ) : (
          <Ionicons
            name={placeholderConfig.icon as any}
            size={iconSize}
            color={placeholderConfig.color}
          />
        )}
      </View>
    );
  }

  const currentUri = usingFallback ? fallbackUri : uri;

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={{ uri: currentUri }}
        style={style}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        {...rest}
      />
      {loading && showLoading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholderText: {
    fontWeight: '700',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
});
