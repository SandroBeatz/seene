import Constants from 'expo-constants';

/** "Seene 1.0.0 (12)"; development builds may have no build number. */
export function appVersionLabel(): string {
  const version = Constants.expoConfig?.version;
  const build = Constants.nativeBuildVersion;
  return build ? `Seene ${version} (${build})` : `Seene ${version}`;
}
