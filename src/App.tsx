import * as faceapi from '@vladmandic/face-api';
import { Carousel, CarouselSlide } from '@yamada-ui/carousel';
import { Dropzone } from '@yamada-ui/dropzone';
import { Button, Center, Container, Heading, Image as Img, Text } from '@yamada-ui/react';
import type { RefObject } from 'react';
import { useRef, useState } from 'react';

type exportImages = {
  name: string;
  url: string;
}

function App() {

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [exportImages, setExportImages] = useState<exportImages[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);

  const getCanvas = (ref: RefObject<HTMLCanvasElement>): HTMLCanvasElement => {
    const canvas: HTMLCanvasElement = ref.current as HTMLCanvasElement;

    return canvas;
  };
  const getContext = (ref: RefObject<HTMLCanvasElement>): CanvasRenderingContext2D => {
    const canvas: HTMLCanvasElement = ref.current as HTMLCanvasElement;

    return canvas.getContext('2d') as CanvasRenderingContext2D;
  };

  const loadModel = async () => {
    if(isModelLoading) return;
    await faceapi.nets.ssdMobilenetv1.loadFromUri(import.meta.env.BASE_URL + 'model');
    setIsModelLoading(true);
  };

  const handleAcceptedFile = async (files: File[]) => {
    setIsLoading(true);
    await loadModel();
    const images: exportImages[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageObj = new Image();
      imageObj.src = URL.createObjectURL(file);
      const results = await faceapi.detectAllFaces(imageObj);
      const canvas = getCanvas(canvasRef);
      const context = getContext(canvasRef);
      canvas.width = imageObj.width;
      canvas.height = imageObj.height;
      context.drawImage(imageObj, 0, 0, imageObj.width, imageObj.height);

      for (const fc of results) {
        context.beginPath();
        context.rect(
          fc.box.x,
          fc.box.y,
          fc.box.width,
          fc.box.height
        );
        context.lineWidth = 1;
        context.fillStyle = 'black';
        context.fill();
      }
      const base64 = canvas.toDataURL('image/jpeg');
      images.push({
        name: file.name,
        url: base64
      });

    }
    setExportImages(images);
    setIsLoading(false);
  };

  return (
    <Container>
      <Heading textAlign="center">Face Masking App</Heading>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <Dropzone multiple
        accept={{
          'image/*': []
        }}
        isLoading={isLoading}
        onDropAccepted={handleAcceptedFile}
      >
        <Text>顔が写った画像をドラックアンドドロップ</Text>
      </Dropzone>
      {
        !!exportImages.length &&
        <Carousel slideSize="50%" align="center">
          {exportImages.map((image, index) => (
            <CarouselSlide key={index} as={Center} position="relative" justifyContent="center" alignContent="center">
              <Img src={image.url} w="full" />
              <Button as="a" position="absolute" margin="auto" w="2xs" href={image.url} download={image.name} bottom={10} left={0} right={0}>ダウンロード</Button>
            </CarouselSlide>
          ))}
        </Carousel>}
    </Container>
  );
}

export default App;
