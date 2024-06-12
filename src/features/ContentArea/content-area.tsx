import { File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ContentArea() {
  const editorData = [
    {
      name: "Cheetah",
      content:
        "Cheetahs are the fastest land animals, capable of reaching speeds up to 75 mph.",
      image: "../src/assets/6.svg",
    },
    {
      name: "Koala",
      content:
        "Koalas sleep around 20 hours a day and are known for their eucalyptus diet.",
      image: "../src/assets/3.svg",
    },
    {
      name: "Elephant",
      content:
        "Elephants have the largest brains among land animals and demonstrate remarkable intelligence.",
      image: "../src/assets/1.svg",
    },
    {
      name: "Zebra",
      content:
        "Zebras have distinctive black and white stripes that act as a natural defense against predators.",
      image: "../src/assets/7.svg",
    },
    {
      name: "Horse",
      content:
        "Horses have excellent memory and are capable of recognizing human emotions.",
      image: "../src/assets/5.svg",
    },
    {
      name: "Horse",
      content:
        "Horses have excellent memory and are capable of recognizing human emotions.",
      image: "../src/assets/5.svg",
    },
    {
      name: "Horse",
      content:
        "Horses have excellent memory and are capable of recognizing human emotions.",
      image: "../src/assets/5.svg",
    },
    {
      name: "Horse",
      content:
        "Horses have excellent memory and are capable of recognizing human emotions.",
      image: "../src/assets/5.svg",
    },
    {
      name: "Horse",
      content:
        "Horses have excellent memory and are capable of recognizing human emotions.",
      image: "../src/assets/5.svg",
    },
    {
      name: "Horse",
      content:
        "Horses have excellent memory and are capable of recognizing human emotions.",
      image: "../src/assets/5.svg",
    },
    {
      name: "Horse",
      content:
        "Horses have excellent memory and are capable of recognizing human emotions.",
      image: "../src/assets/5.svg",
    },
    {
      name: "Horse",
      content:
        "Horses have excellent memory and are capable of recognizing human emotions.",
      image: "../src/assets/5.svg",
    },
    {
      name: "Horse",
      content:
        "Horses have excellent memory and are capable of recognizing human emotions.",
      image: "../src/assets/5.svg",
    },
  ];

  return (
    <div className="flex-1 bg-muted">
      <div className="overflow-x-hidden relative border-b bg-background">
        <div className="flex whitespace-nowrap transition-transform w-[max-content] ">
          {editorData.map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex px-2 pt-2 pb-1 items-center gap-1 border-r",
                index == 1 ? "bg-muted" : ""
              )}
            >
              <File className="w-4 h-4" />
              {item.name}

              <Button
                variant="ghost"
                className="w-4 h-4 p-0 hover:bg-muted-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
