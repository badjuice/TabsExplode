# Regenerates the extension icons from assets/logo.png.
#   pwsh -File tools/icons.ps1
#
# The source art has transparent padding around the mark, so it is cropped to
# its opaque bounds first, because scaling the padded square directly leaves the
# toolbar icon looking undersized.
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root "assets\logo.png"
$outDir = Join-Path $root "chromium\icons"

$image = [System.Drawing.Image]::FromFile($src)

# Find the opaque bounding box on a downscaled copy: 128x128 is 16k pixel reads
# instead of 1.5M, and the result is mapped back to source coordinates.
$probeSize = 128
$probe = New-Object System.Drawing.Bitmap($probeSize, $probeSize)
$pg = [System.Drawing.Graphics]::FromImage($probe)
$pg.Clear([System.Drawing.Color]::Transparent)
$pg.DrawImage($image, 0, 0, $probeSize, $probeSize)
$pg.Dispose()

$minX = $probeSize; $minY = $probeSize; $maxX = -1; $maxY = -1
for ($y = 0; $y -lt $probeSize; $y++) {
  for ($x = 0; $x -lt $probeSize; $x++) {
    if ($probe.GetPixel($x, $y).A -gt 8) {
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}
$probe.Dispose()

$scale = $image.Width / [double]$probeSize
# Pad by one probe pixel each way so the downscale's soft edge isn't clipped.
$cropX = [Math]::Max(0, ($minX - 1) * $scale)
$cropY = [Math]::Max(0, ($minY - 1) * $scale)
$cropW = [Math]::Min($image.Width - $cropX, ($maxX - $minX + 3) * $scale)
$cropH = [Math]::Min($image.Height - $cropY, ($maxY - $minY + 3) * $scale)
Write-Output ("source {0}x{1} -> content {2}x{3} at {4},{5}" -f $image.Width, $image.Height, [int]$cropW, [int]$cropH, [int]$cropX, [int]$cropY)

$side = [Math]::Max($cropW, $cropH)

# At small sizes the shard trail lands almost entirely on partially covered
# pixels and fades to pale noise. Raising alpha by a gamma curve firms those up
# without touching the already-opaque bookmark body. Larger sizes need none.
$ALPHA_GAMMA = @{ 16 = 0.55; 32 = 0.80 }

foreach ($size in 16, 32, 48, 128) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $bmp.SetResolution(96, 96)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)

  # Fit the content square into the canvas with a hair of breathing room, and
  # centre it so the shard trail doesn't drag the mark off-axis.
  $margin = [Math]::Round($size * 0.02)
  $box = $size - (2 * $margin)
  $drawW = $cropW / $side * $box
  $drawH = $cropH / $side * $box
  $dx = ($size - $drawW) / 2.0
  $dy = ($size - $drawH) / 2.0

  # Both rects must be RectangleF or PowerShell binds the all-integer overload
  # and refuses the sub-pixel destination.
  $dest = New-Object System.Drawing.RectangleF([float]$dx, [float]$dy, [float]$drawW, [float]$drawH)
  $srcRect = New-Object System.Drawing.RectangleF([float]$cropX, [float]$cropY, [float]$cropW, [float]$cropH)
  $g.DrawImage($image, $dest, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()

  if ($ALPHA_GAMMA.ContainsKey($size)) {
    $gamma = $ALPHA_GAMMA[$size]
    for ($y = 0; $y -lt $size; $y++) {
      for ($x = 0; $x -lt $size; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -eq 0 -or $p.A -eq 255) { continue }
        $a = [int][Math]::Round(255 * [Math]::Pow($p.A / 255.0, $gamma))
        $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb([Math]::Min(255, $a), $p.R, $p.G, $p.B))
      }
    }
  }

  $path = Join-Path $outDir "icon$size.png"
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "wrote icon$size.png"
}

$image.Dispose()
