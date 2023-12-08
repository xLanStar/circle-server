export class BufferWriter extends Buffer {
  constructor(size) {
    super(size);
    this.currentOffset = 0;
    this.write = (value) => {
      this.writeUInt8(value.length);
      super.write(value, this.currentOffset);
      this.currentOffset += value.length;
    };
    this.writeUInt8 = (value) => {
      super.writeUInt8(value, this.currentOffset);
      this.currentOffset += 1;
    };
    this.writeUInt32LE = (value) => {
      super.writeUInt32LE(value, this.currentOffset);
      this.currentOffset += 4;
    };
    this.writeFloatLE = (value) => {
      super.writeFloatLE(value, this.currentOffset);
      this.currentOffset += 4;
    };
  }
}
