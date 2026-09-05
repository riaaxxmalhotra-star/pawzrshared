import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import CachedImage from './CachedImage';
import { colors } from '../../theme/colors';
import { layout, borderRadius } from '../../theme/spacing';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
type PlaceholderType = 'user' | 'pet' | 'vet' | 'groomer' | 'cafe' | 'supplier';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  placeholderType?: PlaceholderType;
  online?: boolean;
  verified?: boolean;
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: layout.avatarXs,   // 32
  sm: layout.avatarSm,   // 40
  md: layout.avatarMd,   // 48
  lg: layout.avatarLg,   // 64
  xl: layout.avatarXl,   // 80
  xxl: layout.avatarXxl, // 120
};

const badgeSizeMap: Record<AvatarSize, number> = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
};

export default function Avatar({
  uri,
  name,
  size = 'md',
  placeholderType = 'user',
  online,
  verified,
  style,
}: AvatarProps) {
  const avatarSize = sizeMap[size];
  const badgeSize = badgeSizeMap[size];
  const borderWidth = size === 'xxl' ? 3 : 2;

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }, style]}>
      <CachedImage
        uri={uri}
        placeholderType={placeholderType}
        placeholderText={name}
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        }}
      />

      {/* Online indicator */}
      {online !== undefined && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              borderWidth,
              backgroundColor: online ? colors.success : colors.gray[400],
            },
          ]}
        />
      )}

      {/* Verified badge */}
      {verified && (
        <View
          style={[
            styles.verifiedBadge,
            {
              width: badgeSize + 4,
              height: badgeSize + 4,
              borderRadius: (badgeSize + 4) / 2,
            },
          ]}
        >
          <View style={styles.verifiedCheck} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderColor: colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedCheck: {
    width: 6,
    height: 3,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.white,
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
});
